# Будущее API для проекта

## Подготовка 
Зарегистрироваться и получить api ключ на https://fusionbrain.ai/

Создать в корне (рядом с app.js) файл .env
Добавить в него: 

API_KEY=Ваш_api_key (fusion brain)  
SECRET_KEY=Ваш_secret_key (fusion brain)  
JWT_SECRET_KEY=gfg_jwt_secret_key (для JWT)  
TOKEN_HEADER_KEY=gfg_token_header_key (для JWT)

## Запуск
npm install
node --env-file=.env app.js

Через несколько секунд в корне появится файл с изображением
