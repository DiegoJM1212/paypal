const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT; 

require('dotenv').config(); 
// Credenciales de PayPal Sandbox
const clientId = process.env.PAYPAL_CLIENT_ID;
const secret = process.env.PAYPAL_SECRET;


// Función para obtener el token de acceso
const getAccessToken = async () => {
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    try {
        const response = await axios.post('https://api-m.sandbox.paypal.com/v1/oauth2/token', 'grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error obteniendo el token de acceso:', error);
        throw error;
    }
};

// Función para crear un pago
const createPayment = async (totalAmount) => {
    try {
        const accessToken = await getAccessToken();

        const paymentData = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal'
            },
            transactions: [
                {
                    amount: {
                        total: totalAmount,
                        currency: 'USD'
                    },
                    description: 'Compra de prueba en PayPal'
                }
            ],
            redirect_urls: {
                return_url: 'http://localhost:3000/inicio',
                cancel_url: 'http://localhost:3000/inicio'
            }
        };

        const response = await axios.post('https://api-m.sandbox.paypal.com/v1/payments/payment', paymentData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const approvalUrl = response.data.links.find(link => link.rel === 'approval_url').href;
        return approvalUrl;

    } catch (error) {
        console.error('Error creando el pago:', error);
        throw error;
    }
};

// Ruta para iniciar un pago
app.get('/crear-pago', async (req, res) => {
    try {
        const url = await createPayment('10.00');
        res.send(`Redirige al cliente a esta URL para aprobar el pago: <a href="${url}">${url}</a>`);
    } catch (error) {
        res.status(500).send('Error en el proceso de pago');
    }
});

// Mantener el servidor en ejecución
app.listen(PORT, () => {
    console.log(`Servidor de PayPal en ejecución en http://localhost:${PORT}`);
});

