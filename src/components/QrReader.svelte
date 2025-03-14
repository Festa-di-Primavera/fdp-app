<script lang="ts">
    import {
        Button,
        Dropdown,
        DropdownHeader,
        DropdownItem,
    } from "flowbite-svelte";
    import { AlertCircle, CameraIcon, X } from "lucide-svelte";
    import QrScanner from "qr-scanner";
    import { onDestroy, onMount } from "svelte";
    import FeedbackToast from "./feedbacks/FeedbackToast.svelte";
    
    interface Props {
        codeResult: string;
    }

    let { codeResult = $bindable("") }: Props = $props();

    let videoFrame: HTMLVideoElement | undefined = $state();
    let qrScanner: QrScanner;

    let opened = $state(false);
    let isPaused = $state(false);

    let camSelectOpen = $state(false);

    let devices: MediaDeviceInfo[] = $state([]);
    let selectedCam: string | undefined = $state();

    let feedbackToastOpen = $state(false);
    let feedbackToastMessage = $state("");
    let feedbackToastColor: "red" | "yellow" = $state("red");
    let timeOut: NodeJS.Timeout;

    function triggerToast(message: string, color: "red" | "yellow" = "red") {
        feedbackToastMessage = message;
        feedbackToastOpen = true;
        feedbackToastColor = color;

        clearTimeout(timeOut);
        timeOut = setTimeout(() => {
            feedbackToastOpen = false;
            feedbackToastMessage = "";
            clearTimeout(timeOut);
        }, 3500);
    }

    onMount(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
            if ((error as Error).message === "Device in use") {
                triggerToast("Attento! Una fotocamera è in uso", "yellow");
            }
        }

        const devicesList = await navigator.mediaDevices.enumerateDevices();
        devices = devicesList.filter((device) => device.kind === "videoinput");
        if (videoFrame) {
            qrScanner = new QrScanner(
                videoFrame,
                (result: { data: string }) => {
                    codeResult = result.data;
                    pauseScannerOnCode();
                },
                {
                    onDecodeError: (error) => {
                        codeResult = "";
                    },
                    highlightCodeOutline: true,
                    highlightScanRegion: true,
                }
            );
        }

        let defaultCam = localStorage.getItem("defaultCam");

        if (defaultCam && (defaultCam?.length || 0) === 64)
            updateCamera(defaultCam);
        else {
            let index = devices.findIndex(
                (device) =>
                    device.label.toLowerCase().includes("back") ||
                    device.label.toLowerCase().includes("posteriore")
            );
            index = index === -1 ? 0 : index;

            updateCamera(devices[index].deviceId);
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);
    });

    onDestroy(() => {
        if (typeof document !== "undefined") {
            document?.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            closeScanner();
        }
    });

    function handleVisibilityChange() {
        if (document.visibilityState === "hidden") {
            closeScanner();
        }
    }

    async function updateCamera(cam: string) {
        if (!devices.map((device) => device.deviceId).includes(cam)) return;

        selectedCam = cam;
        localStorage.setItem("defaultCam", cam);
        qrScanner?.setCamera(cam);
        camSelectOpen = false;
    }

    async function openScanner() {
        if (!opened) {
            try {
                await qrScanner.start();
                opened = true;
                codeResult = "";
            } catch (error) {
                if (error === "Camera not found.") {
                    triggerToast("Fotocamera non trovata");
                }
            }

            return;
        }

        if (isPaused) {
            try {
                await qrScanner.$video.play();
                isPaused = false;
                codeResult = "";
            } catch (error) {
                if (error === "Camera not found.") {
                    triggerToast("Fotocamera non trovata");
                }
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

<div class="flex w-full flex-col items-center gap-3">
    <div
        class="relative aspect-square w-[80%] rounded-xl border-4 border-primary-600 bg-gray-400 dark:bg-neutral-600 md:max-w-96"
        id="videocontainer"
    >
        <Button
            class="absolute left-2 top-2 aspect-square rounded-md bg-transparent focus-within:ring-0 hover:bg-opacity-30 dark:bg-transparent dark:hover:bg-opacity-30"
            id="camSelector"
        >
            <CameraIcon
                class="absolute z-10 h-6 w-6 text-primary-800 dark:text-primary-300"
            />
        </Button>
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
            onclick={openScanner}
            class="aspect-square h-full w-full rounded-lg object-cover"
            bind:this={videoFrame}
        ></video>
        {#if opened}
            <button
                type="button"
                class="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-neutral-400 bg-opacity-40 p-1 text-primary-400 dark:text-primary-900"
                onclick={closeScanner}
            >
                Chiudi
                <X class="size-5" />
            </button>
        {/if}
    </div>
    <span class="text-center font-semibold text-primary-500"
        >{!opened || isPaused
            ? "Clicca nel riquadro per scansionare"
            : "Scansione in corso"}</span
    >
</div>
{#if devices.length > 0}
    <Dropdown
        bind:open={camSelectOpen}
        placement="bottom-start"
        triggeredBy="#camSelector"
    >
        <DropdownHeader>Fotocamere</DropdownHeader>
        {#each devices as device}
            <DropdownItem
                on:click={() => {
                    updateCamera(device.deviceId);
                }}
                class={device.deviceId === selectedCam
                    ? "text-primary-800 dark:text-primary-200"
                    : ""}
            >
                {device.label}
            </DropdownItem>
        {/each}
    </Dropdown>
{/if}

<FeedbackToast
    bind:open={feedbackToastOpen}
    bind:message={feedbackToastMessage}
    ToastIcon={AlertCircle}
    bind:color={feedbackToastColor}
/>
