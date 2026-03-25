const crypto = require("crypto");
const QRCode = require("qrcode");
const {
    ImageUploadService
} = require("node-upload-images");
const {
    URLSearchParams
} = require("url");
const axios = require("axios");


// 🧩 CLASS OrderKuota
class OrderKuota {
    static API_URL = "https://app.orderkuota.com/api/v2";
    static API_URL_ORDER = "https://app.orderkuota.com/api/v2/order";
    static HOST = "app.orderkuota.com";
    static USER_AGENT = "okhttp/4.12.0";
    static APP_VERSION_NAME = "25.09.18";
    static APP_VERSION_CODE = "250918";
    static APP_REG_ID =
        "cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw";
    static PHONE_MODEL = "SM-G960N";
    static PHONE_UUID = "cdzXkBynRECkAODZEHwkeV";
    static PHONE_ANDROID_VERSION = "9";

    constructor(username = null, authToken = null) {
        this.username = username;
        this.authToken = authToken;
    }

    async loginRequest(username, password) {
        const payload = new URLSearchParams({
            username,
            password,
            request_time: Date.now(),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID,
        });
        return await this.request("POST", `${OrderKuota.API_URL}/login`, payload);
    }

    async getAuthToken(username, otp) {
        const payload = new URLSearchParams({
            username,
            password: otp,
            request_time: Date.now(),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID,
        });
        return await this.request("POST", `${OrderKuota.API_URL}/login`, payload);
    }

    // 🔄 Mutasi QRIS
    async getTransactionQris(type = "", userId = null) {
        if (!userId && this.authToken) {
            userId = this.authToken.split(":")[0];
        }

        const payload = new URLSearchParams({
            request_time: Date.now(),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID,
            auth_username: this.username,
            auth_token: this.authToken,
            "requests[qris_history][jumlah]": "",
            "requests[qris_history][jenis]": type,
            "requests[qris_history][page]": "1",
            "requests[qris_history][dari_tanggal]": "",
            "requests[qris_history][ke_tanggal]": "",
            "requests[qris_history][keterangan]": "",
            "requests[0]": "account",
            app_version_name: OrderKuota.APP_VERSION_NAME,
            ui_mode: "light",
            phone_model: OrderKuota.PHONE_MODEL,
        });

        const endpoint = userId ?
            `${OrderKuota.API_URL}/qris/mutasi/${userId}` :
            `${OrderKuota.API_URL}/get`;

        return await this.request("POST", endpoint, payload);
    }

    // 🧾 Generate QRIS
    async generateQr(amount = "") {
        const payload = new URLSearchParams({
            request_time: Date.now(),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID,
            auth_username: this.username,
            auth_token: this.authToken,
            "requests[qris_merchant_terms][jumlah]": amount,
            "requests[0]": "qris_merchant_terms",
            app_version_name: OrderKuota.APP_VERSION_NAME,
            ui_mode: "light",
            phone_model: OrderKuota.PHONE_MODEL,
        });

        const response = await this.request("POST", `${OrderKuota.API_URL}/get`, payload);
        try {
            if (response.success && response.qris_merchant_terms?.results) {
                return response.qris_merchant_terms.results;
            }
            return response;
        } catch (err) {
            return {
                error: err.message,
                raw: response
            };
        }
    }

    // 💸 Withdraw QRIS
    async withdrawalQris(amount = "") {
        const payload = new URLSearchParams({
            request_time: Date.now(),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID,
            auth_username: this.username,
            auth_token: this.authToken,
            "requests[qris_withdraw][amount]": amount,
            "requests[0]": "account",
            app_version_name: OrderKuota.APP_VERSION_NAME,
            ui_mode: "light",
            phone_model: OrderKuota.PHONE_MODEL,
        });

        return await this.request("POST", `${OrderKuota.API_URL}/get`, payload);
    }

    buildHeaders() {
        return {
            Host: OrderKuota.HOST,
            "User-Agent": OrderKuota.USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded",
            "accept-encoding": "gzip",
        };
    }

    async request(method, url, body = null) {
        try {
            const res = await axios({
                method,
                url,
                headers: this.buildHeaders(),
                data: body ? body.toString() : null,
                validateStatus: () => true,
            });
            return res.data;
        } catch (err) {
            return {
                error: err.message
            };
        }
    }
}

// 🧮 Helper Functions
function convertCRC16(str) {
    let crc = 0xffff;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return ("000" + (crc & 0xffff).toString(16).toUpperCase()).slice(-4);
}

function generateTransactionId() {
    return `Z7:PEDIA-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function generateExpirationTime() {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 30);
    return expirationTime;
}

async function elxyzFile(buffer) {
    const service = new ImageUploadService("pixhost.to");
    const {
        directLink
    } = await service.uploadFromBinary(buffer, "Z7.png");
    return directLink;
}

async function createQRIS(amount, codeqr) {
    let qrisData = codeqr.slice(0, -4);
    const step1 = qrisData.replace("010211", "010212");
    const [prefix, suffix] = step1.split("5802ID");
    const uang = "54" + ("0" + amount.length).slice(-2) + amount + "5802ID";
    const final = prefix + uang + suffix;
    const result = final + convertCRC16(final);
    const buffer = await QRCode.toBuffer(result);
    const uploadedFile = await elxyzFile(buffer);

    return {
        idtransaksi: generateTransactionId(),
        jumlah: amount,
        expired: generateExpirationTime(),
        imageqris: {
            url: uploadedFile
        },
    };
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        if (!text) {
            return await conn.sendMessage(m.chat, {
                text: handler.help.replace(/%p/g, usedPrefix)
            }, {
                quoted: m
            });
        }

        const [subcommand, ...args] = text.trim().split(/\s+/);
        const argString = args.join(' ');
        const params = argString.split('|').map(p => p.trim());
        const ok = new OrderKuota();

        switch (subcommand.toLowerCase()) {
            case 'getotp': {
                const [username, password] = params;
                if (!username || !password) {
                    return await conn.sendMessage(m.chat, {
                        text: `Usage: ${usedPrefix + command} getotp <username>|<password>`
                    }, {
                        quoted: m
                    });
                }

                await conn.sendMessage(m.chat, {
                    text: 'Requesting OTP...'
                }, {
                    quoted: m
                });

                try {
                    const result = await ok.loginRequest(username, password);
                    console.log('OTP result:', result); // Debug: cek struktur respons

                    if (result.success) {
                        // Ambil message jika ada, jika tidak tampilkan default
                        const message = result.results?.message || 'OTP requested successfully!';
                        await conn.sendMessage(m.chat, {
                            text: `✅ *Success!*\n\n${message}`
                        }, {
                            quoted: m
                        });
                    } else {
                        await conn.sendMessage(m.chat, {
                            text: `❌ *Failed!*\n\n${result.message || 'Unknown error occurred.'}`
                        }, {
                            quoted: m
                        });
                    }
                } catch (err) {
                    console.error('Error requesting OTP:', err);
                    await conn.sendMessage(m.chat, {
                        text: '❌ *Error!* Something went wrong while requesting OTP.'
                    }, {
                        quoted: m
                    });
                }
                break;
            }

            case 'gettoken': {
                const [username, otp] = params;
                if (!username || !otp) {
                    return await conn.sendMessage(m.chat, {
                        text: `Usage: ${usedPrefix + command} gettoken <username>|<otp>`
                    }, {
                        quoted: m
                    });
                }

                await conn.sendMessage(m.chat, {
                    text: 'Verifying OTP...'
                }, {
                    quoted: m
                });

                try {
                    const result = await ok.getAuthToken(username, otp);
                    console.log('Login result:', result);

                    if (result.success) {
                        const token = result.results?.token || 'undefined';

                        let msg = `✅ *Login Success!*\n\n`;
                        msg += `*Token:* \`\`\`${token}\`\`\`\n`;
                        msg += `ℹ️ Use this token for other commands.`;

                        await conn.sendMessage(m.chat, {
                            text: msg
                        }, {
                            quoted: m
                        });
                    } else {
                        await conn.sendMessage(m.chat, {
                            text: `❌ *Failed!*\n\n${result.message || 'Invalid OTP or username.'}`
                        }, {
                            quoted: m
                        });
                    }
                } catch (err) {
                    console.error('Error getting token:', err);
                    await conn.sendMessage(m.chat, {
                        text: `❌ *Error!* \n\nSomething went wrong while getting the token.`
                    }, {
                        quoted: m
                    });
                }

                break;
            }

            case 'mutasi': {
                const [username, token] = params;
                if (!username || !token) return await conn.sendMessage(m.chat, {
                    text: `Usage: ${usedPrefix + command} mutasi <username>|<token>`
                }, {
                    quoted: m
                });

                await conn.sendMessage(m.chat, {
                    text: 'Fetching QRIS transaction history...'
                }, {
                    quoted: m
                });
                const okWithAuth = new OrderKuota(username, token);
                const result = await okWithAuth.getTransactionQris();

                if (result.success && result.qris_history?.results?.history) {
                    let msg = `📜 *QRIS Mutation*\n\n`;
                    if (result.qris_history.results.history.length === 0) {
                        msg += "No transactions found.";
                    } else {
                        result.qris_history.results.history.forEach(trx => {
                            msg += `*ID:* ${trx.invoice}\n`;
                            msg += `*Amount:* ${trx.jumlah_bayar}\n`;
                            msg += `*Status:* ${trx.status}\n`;
                            msg += `*Date:* ${trx.tanggal}\n`;
                            msg += `---------------------\n`;
                        });
                    }
                    await conn.sendMessage(m.chat, {
                        text: msg
                    }, {
                        quoted: m
                    });
                } else {
                    await conn.sendMessage(m.chat, {
                        text: `❌ *Failed to fetch mutations.*\n\n${result.message || 'Invalid credentials or no data.'}`
                    }, {
                        quoted: m
                    });
                }
                break;
            }

            case 'profile': {
                const [username, token] = params;
                if (!username || !token) return await conn.sendMessage(m.chat, {
                    text: `Usage: ${usedPrefix + command} profile <username>|<token>`
                }, {
                    quoted: m
                });

                await conn.sendMessage(m.chat, {
                    text: 'Fetching profile...'
                }, {
                    quoted: m
                });

                try {
                    const okWithAuth = new OrderKuota(username, token);
                    const result = await okWithAuth.getTransactionQris();
                    console.log('Profile result:', result); // Debug: cek struktur terbaru

                    if (result.success && result.account?.results) {
                        const acc = result.account.results;

                        let msg = `👤 *Account Profile*\n\n`;
                        msg += `*ID:* ${acc.id || 'N/A'}\n`;
                        msg += `*Name:* ${acc.name || 'N/A'}\n`;
                        msg += `*Username:* ${acc.username || 'N/A'}\n`;
                        msg += `*Email:* ${acc.email || 'N/A'}\n`;
                        msg += `*Phone:* ${acc.phone || 'N/A'}\n`;
                        msg += `*Balance:* ${acc.balance_str || '0'}\n`;
                        msg += `*QRIS Balance:* ${acc.qris_balance_str || '0'}\n`;
                        msg += `*QRIS Name:* ${acc.qris_name || 'N/A'}\n`;
                        msg += `*QR Code:* ${acc.qrcode || 'N/A'}\n`;
                        msg += `*QRIS:* ${acc.qris || 'N/A'}\n`;

                        await conn.sendMessage(m.chat, {
                            text: msg
                        }, {
                            quoted: m
                        });
                    } else {
                        await conn.sendMessage(m.chat, {
                            text: `❌ *Failed to fetch profile.*\n\n${result.message || 'Invalid credentials.'}`
                        }, {
                            quoted: m
                        });
                    }
                } catch (err) {
                    console.error('Error fetching profile:', err);
                    await conn.sendMessage(m.chat, {
                        text: `❌ *Error!* Something went wrong while fetching profile.`
                    }, {
                        quoted: m
                    });
                }

                break;
            }

            case 'createqr':
            case 'createqris': {
                const [username, token, amount] = params;
                if (!username || !token || !amount || isNaN(amount)) return await conn.sendMessage(m.chat, {
                    text: `Usage: ${usedPrefix + command} createqr <username>|<token>|<amount>`
                }, {
                    quoted: m
                });

                await conn.sendMessage(m.chat, {
                    text: `Generating QRIS for amount ${amount}...`
                }, {
                    quoted: m
                });
                const okWithAuth = new OrderKuota(username, token);
                const qrcodeResp = await okWithAuth.generateQr(amount);

                if (!qrcodeResp || !qrcodeResp.qris_data) {
                    const errorMsg = `❌ *QRIS Generation Failed*\n\n${qrcodeResp.message || 'Could not generate QRIS data. Please check your balance or credentials.'}`;
                    return await conn.sendMessage(m.chat, {
                        text: errorMsg
                    }, {
                        quoted: m
                    });
                }

                const qrData = await createQRIS(amount, qrcodeResp.qris_data);
                const caption = `
🧾 *QRIS Payment Generated*

*Transaction ID:* ${qrData.idtransaksi}
*Amount:* ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(qrData.jumlah)}
*Expires:* ${qrData.expired.toLocaleString('id-ID')}

Scan the QR code above to pay.
                `.trim();

                await conn.sendFile(m.chat, qrData.imageqris.url, 'qris.png', caption, m);
                break;
            }

            case 'wd':
            case 'withdraw': {
                const [username, token, amount] = params;
                if (!username || !token || !amount || isNaN(amount)) return await conn.sendMessage(m.chat, {
                    text: `Usage: ${usedPrefix + command} wd <username>|<token>|<amount>`
                }, {
                    quoted: m
                });

                await conn.sendMessage(m.chat, {
                    text: `Attempting to withdraw ${amount} from QRIS balance...`
                }, {
                    quoted: m
                });
                const okWithAuth = new OrderKuota(username, token);
                const result = await okWithAuth.withdrawalQris(amount);

                if (result.success) {
                    await conn.sendMessage(m.chat, {
                        text: `✅ *Withdrawal Success!*\n\n${result.message || 'Amount has been transferred to main balance.'}`
                    }, {
                        quoted: m
                    });
                } else {
                    await conn.sendMessage(m.chat, {
                        text: `❌ *Withdrawal Failed!*\n\n${result.message || 'Insufficient balance or other error.'}`
                    }, {
                        quoted: m
                    });
                }
                break;
            }

            default:
                await conn.sendMessage(m.chat, {
                    text: `Unknown subcommand. Use *${usedPrefix + command}* to see the help menu.`
                }, {
                    quoted: m
                });
                break;
        }

    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, {
            text: `An internal error occurred: ${e.message}`
        }, {
            quoted: m
        });
    }
};

handler.command = ['orderkuota', 'ok'];
handler.tags = ['tools'];
handler.description = 'Interact with the OrderKuota API for payments and account management.';

handler.help = `
*OrderKuota API Manager*

Provides a command-line interface to interact with various OrderKuota services.
Use the pipe symbol \`|\` to separate arguments.

*Usage:*
%p<command> <subcommand> <arguments>

*Subcommands:*
▸ *getotp <username>|<password>*
  Requests an OTP for login (Step 1).

▸ *gettoken <username>|<otp>*
  Gets an authentication token using the OTP (Step 2).

▸ *profile <username>|<token>*
  Fetches your account profile and balance.

▸ *mutasi <username>|<token>*
  Checks QRIS transaction history.

▸ *createqr <username>|<token>|<amount>*
  Generates a dynamic QRIS payment code.

▸ *wd <username>|<token>|<amount>*
  Withdraws funds from QRIS balance to main balance.

*Example:*
%porderkuota getotp myuser|mypass123
%porderkuota gettoken myuser|123456
`.trim();

module.exports = handler;