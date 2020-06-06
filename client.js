const net = require('net')
const http = require('http')
const https = require('https')

function askFundraise() {
    return new Promise((resolve, reject) => {
        const start = new Date().getTime()
        const req = https.get('https://fundraiseup.com/', res => {
            let data = []
            res.on('data', chunk => {
                data.push(chunk)
            })
            res.on('end', () => {
                if (data.length) {
                    resolve(new Date().getTime() - start)
                } else reject('Client -> askFundraise -> Error: Fundraise empty response.')
            })
        })
        req.on('error', e => reject('Client -> askFundraise -> Error: ', e))
        req.end()
    })
}

function askMyServer(data) {
    const options = {
        host: 'localhost',
        port: '8080',
        path: '/data',
        method: 'POST'
    }

    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            res.on('data', chunk => {
            })
            res.on('end', () => {
                resolve(res.statusCode)
            })
        })
        req.on('error', e => reject('Client -> askFundraise -> Error: ', e))
        req.end(data)
    })
}


const client = net.connect({port: 8080}, async () => {
    console.log('Client is running...')

    let deliveryAttempt = 0
    let retryAttempt = 0
    let retry = []

    let exponentialFactor = 1
    let exponentialBackoff = 0

    const intervalId = setInterval(async () => {
        if (exponentialBackoff > 10000)  {
            clearInterval(intervalId)
            client.end()
        }
        else {
            deliveryAttempt++
            if (!retry.length) {
                const date = new Date().getTime() // Момент пинга
                const responseTime = await askFundraise() // Время ответа
                const pingId = deliveryAttempt // порядковый номер пинга сайта с момента запуска клиента (?)

                // Данные для отправки на сервер:
                const data = JSON.stringify({pingId, deliveryAttempt, date, responseTime})
                console.log('Client -> going to send: ', data)

                const serverResponse = await askMyServer(data)
                console.log('Client -> server response is: ', serverResponse)

                if (serverResponse === 500) {
                    retry.push(data)
                    retryAttempt++
                }
            } else {
                // Экспоненциальная выдержка:
                exponentialBackoff = (Math.floor(Math.random() * 1000) + 1) + exponentialFactor
                exponentialFactor *= 2

                setTimeout(async () => {
                    if (retry.length) {
                        const retryString = retry[0]
                        retry.shift()
                        console.log('Client -> going to resend with exponential backoff %s ms: %s', exponentialBackoff, retryString)

                        const serverResponse = await askMyServer(retryString)
                        console.log('Client -> Retry attempt %s delivery attempt %s -> server response is: %s',
                            retryAttempt, JSON.parse(retryString).deliveryAttempt, serverResponse)

                        if (serverResponse === 500) {
                            retry.push(retryString)
                            retryAttempt++
                        }
                    }
                }, exponentialBackoff)
            }
        }
    }, 1000)
})

client.on('connect', () => {
    console.log('Client -> connected to server.')
})

client.on('error', e => {
    console.log('Client -> error: ', e.message)
})

client.on('end', () => {
    console.log('Client -> disconnected from server.')
})

client.on('close', () => {
    console.log('Client -> closed.')
})
