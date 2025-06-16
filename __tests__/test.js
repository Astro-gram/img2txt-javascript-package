import Img2TxtClient from '../src/index.ts';

const client = new Img2TxtClient("API_KEY_HERE");


(async () => {
    try {
        const result = await client.process("C:\\Users\\benwe\\Downloads\\plane2.png", "structured", undefined, `{
    "destinations": [
        ""
    ]
}`)
        console.log(result)
    } catch (error) {
        console.error('Error generating image:', error);
    }
})();