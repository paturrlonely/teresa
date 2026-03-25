const axios = require('axios');
const FormData = require('form-data');

async function Uguu(buffer, filename) {
    let form = new FormData();
    form.append('files[]', buffer, {
        filename
    });
    let {
        data
    } = await axios.post('https://uguu.se/upload.php', form, {
        headers: form.getHeaders()
    });
    if (data?.files?.[0]?.url) return data.files[0].url;
    else throw 'Upload gagal';
}

let handler = async (m, {
    conn,
    args
}) => {
    try {
        await m.react('⌛');
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        if (!mime.startsWith('image/')) throw 'Kirim atau reply gambar untuk diproses.';
        let media = await q.download();
        let url = await Uguu(media, `image.${mime.split('/')[1]}`);
        let {
            data
        } = await axios.get(`https://api.offmonprst.my.id/api/unblur?url=${url}`);
        await m.react('✅');
        await conn.sendMessage(m.chat, {
            image: {
                url: data.result.output
            }
        }, {
            quoted: m
        });
    } catch (e) {
        await m.react('❌');
        m.reply(`${e}`);
    }
};

handler.help = ['unblur'];
handler.tags = ['image'];
handler.command = ['unblur'];
handler.limit = true;

module.exports = handler;