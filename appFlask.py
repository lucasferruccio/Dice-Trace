import base64, io
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas as rotas

# Carregar o modelo YOLO uma vez
model = YOLO("TestModel.pt")


# Rota para processar a imagem
@app.route('/process_image', methods=['POST'])
def process_image():

    # Recebe a imagem base64 do frontend
    data = request.json

    # Convertendo a imagem para o tipo aceitado pelo YOLO
    image_data = data['image'].split(",")[1] # Extrair a string base64 e remover o prefixo (se existir)
    image_bytes = base64.b64decode(image_data) # Decodificar a string base64 para bytes
    image = Image.open(io.BytesIO(image_bytes)) # Abrir a imagem usando o PIL
    # Converter a imagem de RGBA (se necessário) para RGB
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    image_np = np.array(image) # Converter a imagem em um array NumPy (YOLO espera arrays de imagem)

    # Faz a leitura da imagem com o YOLO
    results = model(image_np)

    # String que vai guardar os dados encontrados em cada frame
    dicesFound = ""

    # Faz a coleta dos itens encontrados pela IA
    for result in results:
        for box in result.boxes:
            label = model.names[int(box.cls[0])] # Acesso ao label das classes
            # confidence = box.conf[0] # Score de confiança
            if label == "D6 - 2" or label == "D6 - 1":
                dicesFound += " + 1d6"

    return jsonify({'dicesFound': dicesFound})  # Retorne os dados encontrados

if __name__ == '__main__':
    app.run(debug=True, port=5000)
