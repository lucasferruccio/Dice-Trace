console.log("Dice Trace | Iniciado");

// Definição da classe principal
class DiceTrace {
    static ID = 'dice-trace';

    static TEMPLATES = {
      DICETRACE: `modules/${this.ID}/templates/dicetrace.html`
    }
  }


// Classe para a interface do Dice Trace
class DiceTraceConfig extends FormApplication {

    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            height: 'auto',
            id: 'dice-trace',
            template: DiceTrace.TEMPLATES.DICETRACE,
            title: 'Dice Trace Configuration',
            userId: game.userId,
        };
        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
        return mergedOptions;
    }

    activateListeners(html) {
        super.activateListeners(html);
        // Coloque seu código de webcam dentro de uma função para evitar conflitos globais
        this.initializeWebcam();
    }

    initializeWebcam() {
        'use strict';

        const videoElement = document.getElementById('webcamVideo');
        const canvasElement = document.getElementById('webcamCanvas');
        const snapButton = document.getElementById('snap');
        const detectedDiv = document.getElementById('detectedDices');

        const constraints = {
            audio: false,
            video: { width: 640, height: 480 }
        };

        async function init() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                videoElement.srcObject = stream;
            } catch (error) {
                console.error('Erro ao acessar a webcam:', error);
            }
        }

        init();

        // Adiciona um gatilho ao clicar o botão
        snapButton.addEventListener('click', function () {
            // Captura a imagem da webcam
            const context = canvasElement.getContext('2d');
            context.drawImage(videoElement, 0, 0, 640, 480);
            const imgData = canvasElement.toDataURL('image/png');

            // Envia a imagem capturada
            fetch('http://localhost:5000/process_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imgData })
            })
            .then(response => response.json())
            .then(data => {
                detectedDiv.innerText = data.dicesFound;
                console.log(data.dicesFound);
            })
            .catch(error => {
                console.error('Erro ao enviar a imagem:', error);
                detectedDiv.innerText = 'Erro ao enviar a imagem!';
            });
        });
    }
}

//Gatilho de inicio da aplicação ao abrir o FoundryVTT e adiciona ao usuario o botão para ter acesso a funcionalidade do modulo
Hooks.on('renderPlayerList', (playerList, html) => {
    const loggedInUserListItem = html.find(`[data-user-id="${game.userId}"]`);

    loggedInUserListItem.append(
      `<button type='button' class='config-icon-button' title='Open Dice Trace Interface'><i class='fas fa-computer'></i></button>`
    );

    html.on('click', '.config-icon-button', async () => {
        new DiceTraceConfig().render(true, { userId: game.userId });
    });
});
