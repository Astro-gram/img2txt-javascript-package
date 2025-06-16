import axios, { AxiosHeaders } from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

/**
 * @interface UploadInfo
 * @property {string} url - The URL to upload the file to.
 * @property {string} key - A key associated with the upload, often part of the final URL.
 */
interface UploadInfo {
    url: string;
    key: string;
}

/**
 * @interface Img2TxtResponse
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {string} text - The extracted text from the image.
 * @property {any} [data] - Optional additional data from the response.
 */
interface Img2TxtResponse {
    success: boolean;
    text: string;
    data?: any;
}

/**
 * Client for the Img2Txt.io API to upload images and process them into text.
 */
export default class Img2TxtClient {
    private readonly baseUrl: string = "https://img2txt.io/api/";
    private readonly headers: AxiosHeaders;

    /**
     * Creates an instance of Img2TxtClient.
     * @param {string} apiKey - Your Img2Txt.io API key.
     */
    constructor(apiKey: string) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('API Key is required and must be a string.');
        }
        this.headers = new AxiosHeaders({ Authorization: `Bearer ${apiKey}` });
    }

    /**
     * Fetches a pre-signed S3 upload URL from the API.
     * @private
     * @param {string} filePath - Path to the image file.
     * @returns {Promise<UploadInfo>} - An object containing the upload URL and key.
     * @throws {Error} - If the API response is invalid.
     */
    private async getUploadUrl(filePath: string): Promise<UploadInfo> {
        const fileName = path.basename(filePath);
        const fileSize = fs.statSync(filePath).size;
        const url = `${this.baseUrl}get-upload-url?name=${encodeURIComponent(fileName)}&size=${fileSize}`;

        try {
            const resp = await axios.get<UploadInfo>(url, {
                headers: this.headers,
            });
            const data = resp.data;

            if (!data.url || !data.key) {
                throw new Error(`Invalid upload-url response: Missing URL or Key. Status: ${resp.status}`);
            }
            return data;
        } catch (error: any) {
            throw new Error(`Failed to get upload URL: ${error.message || error}`);
        }
    }

    /**
     * Uploads the image file to the pre-signed S3 URL.
     * @private
     * @param {string} uploadUrl - The URL to upload to.
     * @param {string} filePath - Path to the image file.
     * @returns {Promise<string>} - The URL of the uploaded file on the UFS.
     * @throws {Error} - If the upload fails or the response is invalid.
     */
    private async uploadFile(uploadUrl: string, filePath: string): Promise<string> {
        const fileName = path.basename(filePath);
        const form = new FormData();
        form.append("file", fs.createReadStream(filePath), fileName);

        try {
            const resp = await axios.put<{ ufsUrl: string }>(uploadUrl, form, {
                headers: {
                    ...this.headers.toJSON(),
                    ...form.getHeaders(),
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });

            const data = resp.data;
            if (!data.ufsUrl) {
                throw new Error(`Invalid upload response: Missing UFS URL. Status: ${resp.status}`);
            }
            return data.ufsUrl;
        } catch (error: any) {
            throw new Error(`Failed to upload file: ${error.message || error}`);
        }
    }

    /**
     * Sends the image URL to the API for text extraction.
     * @private
     * @param {string} imageUrl - The URL of the uploaded image.
     * @param {string} [outputType="raw"] - Desired output format (e.g., "raw", "json").
     * @param {string} [description=""] - Optional context or description for the AI.
     * @param {string} [outputStructure=""] - JSON string defining expected output structure.
     * @returns {Promise<Img2TxtResponse>} - The API response containing the extracted text.
     * @throws {Error} - If processing fails or the response is invalid.
     */
    private async imageToText(
        imageUrl: string,
        outputType: string = "raw",
        description: string = "",
        outputStructure: string = ""
    ): Promise<Img2TxtResponse> {
        const url = `${this.baseUrl}image-to-text`;
        const payload: Record<string, any> = {
            imageUrl,
            outputType,
        };

        if (description) {
            payload.description = description;
        }
        if (outputStructure) {
            try {
                // Parse and then stringify to ensure it's valid JSON and remove extra whitespace
                const parsed = JSON.parse(outputStructure);
                payload.outputStructure = JSON.stringify(parsed);
            } catch (err: any) {
                throw new Error(`outputStructure must be valid JSON: ${err.message}`);
            }
        }

        try {
            const resp = await axios.post<Img2TxtResponse>(url, payload, {
                headers: {
                    ...this.headers.toJSON(), // Use toJSON() to properly merge headers
                    "Content-Type": "application/json",
                },
            });

            const data = resp.data;
            if (data.success === false) {
                // If the API explicitly returns success: false, throw an error
                throw new Error(`Processing failed: ${JSON.stringify(data.data || data.text || data)}`);
            }
            return data;
        } catch (error: any) {
            // Handle network errors or non-2xx responses from axios
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`API call failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                throw new Error(`Failed to process image: ${error.message || error}`);
            }
        }
    }

    /**
     * Upload an image (file path) and process it into text.
     *
     * @param {string} imagePath                  - Path to image file.
     * @param {string} [outputType="raw"]         - Desired output format ("raw", "json", etc.).
     * @param {string} [description=""]           - Optional context or description for the AI.
     * @param {string} [outputStructure=""]       - JSON string defining expected output structure for AI.
     * @returns {Promise<Img2TxtResponse>}        - The API response containing the extracted text.
     * @throws {Error}                            - If the input file is invalid or processing fails.
     */
    public async process(
        imagePath: string,
        outputType: string = "raw",
        description: string = "",
        outputStructure: string = ""
    ): Promise<Img2TxtResponse> {
        if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
            throw new Error(`File not found or is not a file: ${imagePath}`);
        }

        try {
            const uploadInfo = await this.getUploadUrl(imagePath);
            const ufsUrl = await this.uploadFile(uploadInfo.url, imagePath);

            // Brief pause before processing to ensure S3 eventual consistency
            await new Promise((resolve) => setTimeout(resolve, 200));

            return this.imageToText(ufsUrl, outputType, description, outputStructure);
        } catch (error: any) {
            throw new Error(`Image processing failed: ${error.message || error}`);
        }
    }
}