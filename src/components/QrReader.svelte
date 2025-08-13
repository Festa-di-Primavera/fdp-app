<script lang="ts">
    import Badge from "$lib/components/ui/badge/badge.svelte";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import { CameraIcon, X } from "@lucide/svelte";
    import QrScanner from "qr-scanner";
    import { onDestroy, onMount } from "svelte";
    import { toast } from "svelte-sonner";

    interface Props {
        codeResult: string;
    }

    let { codeResult = $bindable("") }: Props = $props();

    let videoFrame: HTMLVideoElement | undefined = $state();
    let qrScanner: QrScanner;

    let opened = $state(false);
    let isPaused = $state(false);

    let camSelectOpen = $state(false);
    let camSelectAnchor = $state<HTMLElement>(null!);

    let devices: MediaDeviceInfo[] = $state([]);
    let selectedCam: string | undefined = $state();

    function triggerToast(message: string, type: "error" | "warn" = "error") {
        if (type === "error") {
            toast.error(message);
        } else if (type === "warn") {
            toast.warning(message);
        }
    }

    onMount(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
            if ((error as Error).message === "Device in use") {
                triggerToast("Attento! Una fotocamera è in uso", "warn");
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
        class="relative aspect-square w-[80%] rounded-xl border-2 border-app-accent md:max-w-96"
        id="videocontainer"
    >
        <button
            bind:this={camSelectAnchor}
            class="absolute left-3 top-3 aspect-square rounded-md bg-transparent focus-within:ring-0 hover:bg-opacity-30 dark:bg-transparent dark:hover:bg-opacity-30"
            onclick={() => (camSelectOpen = !camSelectOpen)}
        >
            <CameraIcon
                class="absolute z-10 h-6 w-6 text-app-accent"
            />
        </button>
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
            onclick={openScanner}
            class="aspect-square h-full w-full rounded-lg object-cover"
            bind:this={videoFrame}
        ></video>
        {#if opened}
            <button onclick={closeScanner}>
                <Badge class="absolute right-3 top-3 z-10 flex items-center justify-center gap-1 rounded-md text-app-accent bg-black/30">
                    Chiudi
                    <X class="size-5" />
                </Badge>
            </button>
        {/if}
    </div>
    <span class="text-center font-semibold text-app-accent"
        >{!opened || isPaused
            ? "Clicca nel riquadro per scansionare"
            : "Scansione in corso"}</span
    >
</div>
{#if devices.length > 0}
    <DropdownMenu.Root bind:open={camSelectOpen}>
        <DropdownMenu.Content
            customAnchor={camSelectAnchor}
            align="start"
            side="bottom"
            class="w-56 mt-6"
        >
            {#each devices as device}
                <DropdownMenu.Item
                    onclick={() => {
                        updateCamera(device.deviceId);
                    }}
                    class={device.deviceId === selectedCam
                        ? "text-app-accent font-semibold"
                        : ""}
                >
                    {device.label}
                </DropdownMenu.Item>
            {/each}
        </DropdownMenu.Content>
    </DropdownMenu.Root>
{/if}
