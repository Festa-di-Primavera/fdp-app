<script lang="ts">
    import QrScanner from 'qr-scanner';
    import { onDestroy, onMount } from 'svelte';
    import { CameraIcon, X } from 'lucide-svelte';
    import { Button, Dropdown, DropdownHeader, DropdownItem } from 'flowbite-svelte';
    export let codeResult: string = '';

    let videoFrame: HTMLVideoElement;
    let qrScanner: QrScanner;

    let alreadyFound = false;
    let opened = false;
    let isPaused = true;

    let camSelectOpen = false;

    let devices: MediaDeviceInfo[] = [];
    let selectedCam: string;

    onMount(async () => {
        try{
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
        }
        catch (error) {
            /* 
                TODO: handle error 
                message: Device in use
            */
        }
        
        const devicesList = await navigator.mediaDevices.enumerateDevices();
        devices = devicesList.filter(device => device.kind === 'videoinput');

        qrScanner = new QrScanner(
            videoFrame,
            result => {codeResult = result.data; pauseScannerOnCode();},
            {
                onDecodeError: error => {
                    codeResult = '';
                },
                highlightCodeOutline: true,
                highlightScanRegion: true,
                //overlay: document.getElementById('overlay') as HTMLDivElement
            }
        );

        let index = devices.findIndex(device => device.label.toLowerCase().includes('back'));
        index = index === -1 ? 0 : index;

        updateCamera(devices[index].deviceId);

        document.addEventListener("visibilitychange", handleVisibilityChange);
    });

    onDestroy(() => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        closeScanner();
    });

    function handleVisibilityChange() {
        if (document.visibilityState === "hidden") {
            closeScanner();
        }   
    }

    async function updateCamera(cam: string) {
        selectedCam = cam;
        qrScanner.setCamera(cam);
        camSelectOpen = false;
    }

    async function openScanner(){
        if(!opened) {
            try{
                await qrScanner.start();
                opened = true;
                alreadyFound = false;
                codeResult = '';
            } catch (error) {
                /* 
                    TODO: handle error
                    error === 'Camera not found.' <- it is a string
                */
            }

            return
        }


        if(isPaused){
            try{
                await qrScanner.$video.play();
                isPaused = false;
                codeResult = '';
                alreadyFound = false;
            } catch (error) {
                /* 
                    TODO: handle error
                    error === 'Camera not found.' <- it is a string
                */
            }

            isPaused = false;
            return;
        }

    }

    function pauseScannerOnCode() {
        qrScanner.$video.pause();
        isPaused = true;

    }

    function closeScanner() {
		if (opened) {			
            qrScanner.stop();

			opened = false;
        }
    }
</script>

<div class="w-full flex flex-col gap-3 items-center">
    <div class="relative w-[80%] md:w-96 aspect-square rounded-xl border-primary-600 border-4 dark:bg-gray-600 bg-gray-400" id="videocontainer">
        <Button class="absolute top-2 left-2 aspect-square rounded-md bg-transparent dark:bg-transparent dark:hover:bg-opacity-30 hover:bg-opacity-30 focus-within:ring-0" id="camSelector">
            <CameraIcon class="absolute w-6 h-6 dark:text-primary-800 text-primary-800 z-[25]" />
        </Button>
        <!-- svelte-ignore a11y-media-has-caption -->
        <video on:click={openScanner} class="w-full h-full object-cover rounded-lg" width="24rem" bind:this={videoFrame}/>
        <div id="overlay" class="border-2 rounded-xl border-primary-600" />
        {#if opened}
            <button type="button" class="flex items-center gap-1 text-primary-400 dark:text-primary-900 absolute top-2 right-2 z-10 bg-slate-400 bg-opacity-40 p-1 rounded-md" on:click={closeScanner}>
                Chiudi
                <X class="w-5 h-5 text-primary-400 dark:text-primary-900" />
            </button>
        {/if}
    </div>
    <span class="text-primary-500 text-center font-semibold">{(!opened || isPaused) ? 'Clicca nel riquadro per scansionare' : 'Scansione in corso'}</span>
</div>
{#if devices.length > 0}
    <Dropdown bind:open={camSelectOpen} placement="bottom-start" triggeredBy="#camSelector">
        <DropdownHeader>
            Fotocamere
        </DropdownHeader>
        {#each devices as device}
            <DropdownItem on:click={()=>{updateCamera(device.deviceId);}} class={device.deviceId === selectedCam ? "dark:text-primary-200 text-primary-800" : ''}>
                {device.label}
            </DropdownItem>
        {/each}
    </Dropdown>
{/if}