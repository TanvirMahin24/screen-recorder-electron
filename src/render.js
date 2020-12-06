//Requires
const { desktopCapturer, remote } = require("electron");

const { Menu } = remote;

const videoEl = document.querySelector("#video");
const startBtn = document.getElementById("startBtn");
startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
};
const stopBtn = document.getElementById("stopBtn");
stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};
const windowSelectBtn = document.getElementById("windowSelect");

//Events
windowSelectBtn.onclick = () => getVideoSources();

//Get available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
  const videoOptions = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
    })
  );

  videoOptions.popup();
}
//Media recorder instance to record footage
let mediaRecorder;
const recordedChunks = [];

//window to record
async function selectSource(source) {
  videoEl.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };
  const constraintsAudio = { audio: true };

  //Create Stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  //Preview video
  videoEl.srcObject = stream;
  videoEl.play();

  //Create media recorder
  const options = {
    mimeType: "video/webm; codecs=vp9",
  };
  mediaRecorder = new MediaRecorder(stream, options);

  //Register event Handeler
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

//Captures all recorded chunks
function handleDataAvailable(e) {
  console.log("Video available");
  recordedChunks.push(e.data);
}

//Save the video file on stop
const { dialog } = remote;
const { writeFile } = require("fs");
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm;codec=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  });

  writeFile(filePath, buffer, () => console.log("Video Saved..."));
}
