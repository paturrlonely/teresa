const questions = [{
    image: 'https://cloudkuimages.guru/uploads/images/6820744e84f73.jpg',
    answer: 'nahida'
}];

const handler = async (m, {
    conn,
    db
}) => {
    const sessionKey = `${m.from}:${m.sender}`;

    if (global.interactiveSessions.has(sessionKey)) {
        return m.reply("Anda masih memiliki sesi tebak gambar yang belum selesai di chat ini.");
    }

    const question = questions[Math.floor(Math.random() * questions.length)];
    const {
        image,
        answer
    } = question;

    const botMessage = await conn.sendMessage(m.from, {
        image: {
            url: image
        },
        caption: `*Tebak Gambar!*\n\nSiapakah karakter pada gambar di atas?\nBalas pesan ini dengan jawaban Anda.\n\nWaktu: 30 detik`
    }, {
        quoted: m
    });

    const session = {
        messageId: botMessage.key.id,
        chatId: m.from,
        answer: answer.toLowerCase(),
        timestamp: Date.now(),
        callback: async (replyMessage) => {
            const userAnswer = replyMessage.text.trim().toLowerCase();
            if (userAnswer === session.answer) {
                await replyMessage.reply(`🎉 Benar! Jawabannya adalah *${answer}*. Anda mendapatkan 10 limit.`);
                // Menggunakan 'db' dari parameter, bukan 'global.db'
                const user = db.get('user', replyMessage.sender);
                if (user) user.limit += 10;
                await db.save();
            } else {
                await replyMessage.reply(`❌ Salah! Jawaban yang benar adalah *${answer}*.`);
            }
        }
    };

    global.interactiveSessions.set(sessionKey, session);

    setTimeout(() => {
        if (global.interactiveSessions.has(sessionKey)) {
            const currentSession = global.interactiveSessions.get(sessionKey);
            if (currentSession.messageId === session.messageId) {
                conn.sendMessage(m.from, {
                    text: `Waktu habis! Jawaban yang benar adalah *${answer}*.`
                }, {
                    quoted: botMessage
                });
                global.interactiveSessions.delete(sessionKey);
            }
        }
    }, 30000);
};

handler.command = ["tebakgambar"];
handler.tags = "fun";
handler.description = "Bermain tebak gambar berhadiah limit.";
handler.limit = 1;
handler.group = true;

export default handler;