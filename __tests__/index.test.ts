import Img2TxtClient from '../src';


describe("Img2TxtClient", () => {
    test('raw output', async () => {
        const client = new Img2TxtClient("API_KEY_HERE");

        return await client.process(
            "C:\\Users\\benwe\\Downloads\\plane2.png",
            "raw"
        )
    }, 30000);

    test('description output', async () => {
        const client = new Img2TxtClient("API_KEY_HERE");

        return await client.process(
            "C:\\Users\\benwe\\Downloads\\plane2.png",
            "description",
            "The arrival time for the first flight."
        )
    }, 30000);

    test('structured output', async () => {
        const client = new Img2TxtClient("API_KEY_HERE");

        return await client.process(
            "C:\\Users\\benwe\\Downloads\\plane2.png",
            "structured",
            undefined,
            `{
    "destinations": [
        ""
    ]
}
            `
        )
    }, 30000);




    test('structured output', async () => {
        const client = new Img2TxtClient("API_KEY_HERE");

        return await client.process(
            "C:\\Users\\benwe\\Downloads\\plane2.png",
            "description,structured",
            "make the key 'time' be the arrival time for the first flight.",
            `{
    "destinations": [
        ""
    ],
    "time": ""
}
            `
        )
    }, 30000);
})