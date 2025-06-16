# img2txt.io Javascript Package

A Javascript Package for the [img2txt.io](https://img2txt.io) API. Easily upload images and convert them to plain text or structured output programmatically.

## Installation

```bash
npm install img2txtio
```

Or install directly from source:

```bash
git clone https://github.com/Astro-gram/img2txt-javascript-package.git
cd img2txt-javascript-package
pip install .
```

## Quick Start

```javascript
import { Img2TxtClient } from "img2txtio";

// Initialize client with your API key
const client = new Img2TxtClient("YOUR_API_KEY_HERE");

(async () => {
    try {
        // Convert an image to plain text
        const result = await client.process(
            "path/to/image.jpg",              // image_path
            "raw",                            // output_type (default: raw)
            "Receipt from grocery",           // description (optional)
            ""                                // outputStructure (optional JSON string)
        );
        // `result` is an object containing the API response
        console.log(result);
    } catch (error) {
        console.error(error);
    }
})();
```

## API Reference

### Class: `Img2TxtClient`

#### `__init__(api_key: string)`

Create a new client instance.
- `api_key` (string): Your img2txt.io API key. You can generate one from the [img2txt.io dashboard](https://img2txt.io/dashboard?api-settings=true).

#### `process(imagePath: string, outputType: string = "raw", description: string = "", outputStructure: string = ""): Promise<Record<string, any>>`

Uploads the image at `image_path` and converts it to text or structured output.

Parameters:

- `image_path` (string): Local path to the image file. Must exist, otherwise raises `FileNotFoundError`.
- `output_type` (string): The output format. Defaults to `raw`. Other valid types depend on the API (e.g., `json`, `structured`).
- `description` (string): Optional description or context to improve text extraction.
- `outputStructure` (string): Optional JSON string defining a structure/schema for the output. Must be valid JSON or raises `ValueError`.

Returns:

- `dict`: Parsed JSON response from the API. On failure, raises `RuntimeError`.  
- Example response:
    ```javascript
    {
        'text_output': [
            'Los Angeles', 'Florida', '$235', 'Round trip', 'Economy',
            '1 passenger', 'Lowest total price'
        ],
        'job_id': '16e2364a-e1e2-468e-9be9-e07b695b2afd',
        'creditsLeft': 86.115,
        'success': True,
        'message': 'Image processed successfully.'
    }
    ```


## Error Handling

- Network or HTTP errors raise `requests.exceptions.HTTPError`.
- Missing files raise `FileNotFoundError`.
- Invalid JSON in `outputStructure` raises `ValueError`.
- API failures raise `RuntimeError`.

## License

This project is licensed under the MIT License. See the [`LICENSE`](LICENSE) file for details.