import axios from 'axios'
import FormData from 'form-data'

export default class Text2ImageAPI {
    constructor(url, apiKey, secretKey) {
        this.URL = url;
        this.AUTH_HEADERS = {
            'X-Key': `Key ${apiKey}`,
            'X-Secret': `Secret ${secretKey}`
        }
    }

    async getModels() {
        const response = await axios.get(`${this.URL}key/api/v1/models`, { headers: this.AUTH_HEADERS })
        return response.data[0].id
    }

    async generate(prompt, model, images = 1, width = 1024, height = 1024, style = 3) {
        const styles = ['DEFAULT', 'KANDINSKY', 'UHD', 'ANIME']
        const params = {
            type: 'GENERATE',
            numImages: images,
            width,
            height,
            style: styles[style],
            generateParams: {
                query: prompt
            }
        }

        const formData = new FormData()
        const modelIdData = { value: model, options: { contentType: null } }
        const paramsData = { value: JSON.stringify(params), options: { contentType: 'application/json' } }
        formData.append('model_id', modelIdData.value, modelIdData.options)
        formData.append('params', paramsData.value, paramsData.options)
        
        const response = await axios.post(`${this.URL}key/api/v1/text2image/run`, formData, {
            headers: {
                ...formData.getHeaders(),
                ...this.AUTH_HEADERS,

            },
            'Content-Type': 'multipart/form-data'
        })
        const data = response.data
        return data.uuid

    }
    async checkGeneration(requestId, attempts = 10, delay = 10) {
        while (attempts > 0) {
            try {
                console.log(attempts)
                const response = await axios.get(`${this.URL}key/api/v1/text2image/status/${requestId}`, { headers: this.AUTH_HEADERS })
                const data = response.data
                if (data.status === 'DONE') {
                    return data.images
                }
            } catch (error) {

                console.log(error)
            }
            attempts--
            await new Promise(resolve => setTimeout(resolve, delay * 1000))
        }
    }
};
