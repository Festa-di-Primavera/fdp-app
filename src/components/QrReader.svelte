<script lang="ts">
    import jsQR, { type QRCode } from 'jsqr';
    import { onMount } from 'svelte';
    import { CameraIcon, X } from 'lucide-svelte';
    import { Button, Dropdown, DropdownHeader, DropdownItem } from 'flowbite-svelte';

	export let videoWidth: number = 900;
	export let videoHeight: number = 900;
	export let borderColor: string = "#1ac814";
    export let codeResult: string = '';

	let aspectClass = `aspect-${videoWidth}/${videoHeight}`;

    let video: HTMLVideoElement;
    let canvasElement: HTMLCanvasElement | null;
    let canvas: CanvasRenderingContext2D | null;
    let stream: MediaStream | null;

    let imageData: ImageData;
    let code: QRCode | null;

    let alreadyFound = false;
    let opened = false;
    let isPaused = true;

    let devices: MediaDeviceInfo[] = [];
    let selectedCam: string;

    onMount(() => {
        video = document.createElement("video");
        canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
        canvas = canvasElement!.getContext("2d", { willReadFrequently: true });
        drawReaderIcon(canvasElement!, canvas!);
        navigator.mediaDevices.enumerateDevices().then(devs => {
            devices = devs.filter(device => device.kind === 'videoinput');
            selectedCam = devices[0].deviceId;
        });
    });


    async function setStream(deviceId: string) {
        console.log('setStream', deviceId);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId } });
        video.srcObject = stream;
        video.play();
    }

    async function openScanner(){
        if(!opened || code){
            opened = true;
            alreadyFound = false;
            codeResult = '';
            code = null;

            video = document.createElement("video");
            canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
            canvas = canvasElement!.getContext("2d", { willReadFrequently: true });

            await setStream(selectedCam);

            requestAnimationFrame(tick);
        }
        isPaused = false;
    }

    function pauseScannerOnCode() {
        if (code) {
            video!.pause();
            video!.srcObject = null;
            video!.src = "";
            video!.remove();
            isPaused = true;
        }
    }

    function drawReaderIcon(canvasElement: HTMLCanvasElement, canvas: CanvasRenderingContext2D){
        let svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.61 122.88">
                            <defs>
                                <style>
                                .cls-1 {
                                    fill-rule: evenodd;
                                }
                                </style>
                            </defs>
                            <path fill="white" class="cls-1" d="M26.68,26.77H51.91V51.89H26.68V26.77ZM35.67,0H23.07A22.72,22.72,0,0,0,14.3,1.75a23.13,23.13,0,0,0-7.49,5l0,0a23.16,23.16,0,0,0-5,7.49A22.77,22.77,0,0,0,0,23.07V38.64H10.23V23.07a12.9,12.9,0,0,1,1-4.9A12.71,12.71,0,0,1,14,14l0,0a12.83,12.83,0,0,1,9.07-3.75h12.6V0ZM99.54,0H91.31V10.23h8.23a12.94,12.94,0,0,1,4.9,1A13.16,13.16,0,0,1,108.61,14l.35.36h0a13.07,13.07,0,0,1,2.45,3.82,12.67,12.67,0,0,1,1,4.89V38.64h10.23V23.07a22.95,22.95,0,0,0-6.42-15.93h0l-.37-.37a23.16,23.16,0,0,0-7.49-5A22.77,22.77,0,0,0,99.54,0Zm23.07,99.81V82.52H112.38V99.81a12.67,12.67,0,0,1-1,4.89,13.08,13.08,0,0,1-2.8,4.17,12.8,12.8,0,0,1-9.06,3.78H91.31v10.23h8.23a23,23,0,0,0,16.29-6.78,23.34,23.34,0,0,0,5-7.49,23,23,0,0,0,1.75-8.8ZM23.07,122.88h12.6V112.65H23.07A12.8,12.8,0,0,1,14,108.87l-.26-.24a12.83,12.83,0,0,1-2.61-4.08,12.7,12.7,0,0,1-.91-4.74V82.52H0V99.81a22.64,22.64,0,0,0,1.67,8.57,22.86,22.86,0,0,0,4.79,7.38l.31.35a23.2,23.2,0,0,0,7.5,5,22.84,22.84,0,0,0,8.8,1.75Zm66.52-33.1H96v6.33H89.59V89.78Zm-12.36,0h6.44v6H70.8V83.47H77V77.22h6.34V64.76H89.8v6.12h6.12v6.33H89.8v6.33H77.23v6.23ZM58.14,77.12h6.23V70.79h-6V64.46h6V58.13H58.24v6.33H51.8V58.13h6.33V39.33h6.43V58.12h6.23v6.33h6.13V58.12h6.43v6.33H77.23v6.33H70.8V83.24H64.57V95.81H58.14V77.12Zm31.35-19h6.43v6.33H89.49V58.12Zm-50.24,0h6.43v6.33H39.25V58.12Zm-12.57,0h6.43v6.33H26.68V58.12ZM58.14,26.77h6.43V33.1H58.14V26.77ZM26.58,70.88H51.8V96H26.58V70.88ZM32.71,77h13V89.91h-13V77Zm38-50.22H95.92V51.89H70.7V26.77Zm6.13,6.1h13V45.79h-13V32.87Zm-44,0h13V45.79h-13V32.87Z" />
                        </svg>`;
        
        let svgUrl = "data:image/svg+xml;base64," + btoa(svgString);

        const img = new Image();
        img.src = svgUrl;
        let minSize = Math.min(canvasElement!.width, canvasElement!.height);
        img.width = img.height = minSize/2;
        img.onload = function() {
            let textHeight = minSize/10;
            let text = "Scansiona";

            canvas!.drawImage(img, canvasElement!.width/2 - img.width/2, canvasElement!.height/2 - img.height/2 - textHeight/2, img.width, img.height);
            canvas!.font = textHeight + "px Arial";
            canvas!.fillStyle = "white";
            canvas!.fillText(text, canvasElement!.width/2 - canvas!.measureText(text).width/2, canvasElement!.height/2 - img.height/2 - textHeight/2 + img.height + 1.5*textHeight);
        };

    }

    function closeScanner() {
		if (opened) {
			video!.remove();
			
            stream!.getTracks().forEach(function(track) {
				track.stop();
            });
			canvas?.clearRect(0, 0, canvasElement!.width, canvasElement!.height);
            drawReaderIcon(canvasElement!, canvas!);

			opened = false;
            isPaused = true;
        }
    }

    function drawLine(begin: any, end: any, borderColor: string, xOffset: number, yOffset: number) {
		canvas?.beginPath();
		canvas?.moveTo(begin.x + xOffset, begin.y + yOffset);
		canvas?.lineTo(end.x + xOffset, end.y + yOffset);
		canvas!.lineWidth = 7;
		canvas!.strokeStyle = borderColor;
		canvas?.stroke();
	}

    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Calcola le dimensioni e la posizione per centrare e tagliare il video sulla canvas
            const aspectRatio = video.videoWidth / video.videoHeight;
            const canvasAspectRatio = canvasElement!.width / canvasElement!.height;
            let drawWidth, drawHeight, xOffset, yOffset;

            if (aspectRatio < canvasAspectRatio) {
                drawWidth = canvasElement!.width;
                drawHeight = drawWidth / aspectRatio;
                xOffset = 0;
                yOffset = (canvasElement!.height - drawHeight) / 2;
            } else {
                drawHeight = canvasElement!.height;
                drawWidth = drawHeight * aspectRatio;
                yOffset = 0;
                xOffset = (canvasElement!.width - drawWidth) / 2;
            }

            // Disegna il video sulla canvas
            canvas!.drawImage(video, xOffset, yOffset, drawWidth, drawHeight);

            // Usa la porzione visibile del video per la rilevazione del codice QR
            imageData = canvas!.getImageData(xOffset, yOffset, drawWidth, drawHeight);
            code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                drawLine(code.location.topLeftCorner, code.location.topRightCorner, borderColor, xOffset, yOffset);
				drawLine(code.location.topRightCorner, code.location.bottomRightCorner, borderColor, xOffset, yOffset);
				drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, borderColor, xOffset, yOffset);
				drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, borderColor, xOffset, yOffset);

                alreadyFound = true;
                codeResult = code.data;
                pauseScannerOnCode();
            }
        }

        if (opened) {
            if(!alreadyFound)
                requestAnimationFrame(tick);
        }
		else {
			canvas?.clearRect(0, 0, canvasElement!.width, canvasElement!.height);
			drawReaderIcon(canvasElement!, canvas!);
		}
    }
</script>

<div class="flex flex-col gap-3 items-center">
    <div class="relative w-[80%] md:w-96 rounded-xl border-primary-600 border-4 dark:bg-gray-600 bg-gray-400">
        <Button class="absolute top-2 left-2 aspect-square rounded-md bg-transparent dark:bg-transparent dark:hover:bg-opacity-30 hover:bg-opacity-30 focus-within:ring-0">
            <CameraIcon class="absolute w-6 h-6 dark:text-primary-300 text-primary-800 z-50" />
        </Button>
        {#if devices.length > 0}
            <Dropdown placement="bottom-start" class="w-min">
                <DropdownHeader>
                    Fotocamere
                </DropdownHeader>
                {#each devices as device}
                    <button on:click={()=>{selectedCam = device.deviceId; setStream(selectedCam);}} class="font-light p-0 text-sm w-full text-left text-nowrap">
                        <DropdownItem>
                            {device.label}
                        </DropdownItem>
                    </button>
                {/each}
            </Dropdown>
        {/if}
        <canvas on:click={openScanner} id="canvas" class="w-full rounded-lg {aspectClass}" width={videoWidth} height={videoHeight}>
        </canvas>
        {#if opened}
        <button type="button" class="flex items-center gap-1 text-primary-400 absolute top-2 right-2 z-10 bg-slate-400 bg-opacity-40 p-1 rounded-md" on:click={closeScanner}>
            Chiudi
            <X class="w-5 h-5 text-primary-400" />
        </button>
        {/if}
    </div>
    <span class="text-primary-500 text-center font-semibold">{isPaused ? 'Clicca nel riquadro per scansionare' : 'Scansione in corso'}</span>
</div>