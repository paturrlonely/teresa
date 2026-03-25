import axios from 'axios';

let handler = async (m, {
    conn
}) => {
    try {
        await m.reply('Fetching a random loli image...');
        const {
            data
        } = await axios.get(
            "https://raw.githubusercontent.com/synshin9/loli-r-img/refs/heads/main/links.json"
        );

        // Pilih URL secara acak
        const randomUrl = data[Math.floor(Math.random() * data.length)];

        // Kirim gambar
        await conn.sendMessage(
            m.chat, {
                image: {
                    url: randomUrl
                },
                caption: "Here is your loli image!"
            }, {
                quoted: m
            }
        );

    } catch (error) {
        console.error(error);
        await m.reply('Sorry, an error occurred while fetching the image. Please try again later.');
    }
};

handler.command = /^(loli)$/i;
handler.help = ['loli'];
handler.tags = ['anime'];
handler.description = 'Sends a random loli image from Loli Archive.';

export default handler;