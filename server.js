const http = require('http')

http.createServer(
    (req, res) => {
        res.setHeader("Content-Type", "application/json")
        if (req.method === 'POST' && req.url === '/data') {
            const random = Math.floor(Math.random() * 100) + 1
            if (random <= 20) {
                console.log('Server error!')
                res.writeHead(500)
                res.end()
            } else if (random > 20 && random <= 40) {
                console.log('Freeze...')
                setTimeout(() => {
                    console.log('Awake.')
                    res.writeHead(200)
                    res.end()
                }, 11000)
            } else {
                let body = ''
                req.on('data', data => {
                    body += data
                })
                req.on('end', () => {
                    const i = Object.assign({
                        pingId: '',
                        deliveryAttempt: '',
                        date: '',
                        responseTime: ''
                    }, JSON.parse(body))
                    console.log('SERVER -> received data: ', body)
                })
                res.end()
            }
        } else {
            res.writeHead(404)
            res.end()
        }
    }
).listen({
    port: 8080,
    host: 'localhost',
}, () => {
    console.log('Server is running...')
})
