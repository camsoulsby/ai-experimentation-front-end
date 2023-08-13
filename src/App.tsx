import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  createTheme,
  ThemeProvider,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";

const speakText = (text: string) => {
  const synth = window.speechSynthesis;

  // Get the list of available voices
  const voices = synth.getVoices();

  // Filter the voices to find one with a male characteristic if available
  const maleVoice = voices.find(
    (voice) => voice.name.includes("Male") || voice.lang.includes("Male")
  );

  const utterance = new SpeechSynthesisUtterance(text);

  // If a male voice is available, set it for the utterance
  if (maleVoice) {
    utterance.voice = maleVoice;
  }

  synth.speak(utterance);
};

const App: React.FC = () => {
  const [selectedAPIEndpoint, setSelectedAPIEndpoint] = useState(
    "http://localhost:3001/api/upload-audio"
  );
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [htmlToOutput, setHtmlToOutput] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const theme = createTheme({
    palette: {
      primary: {
        main: "#2EE59D ",
        dark: "#27CC88",
      },
      secondary: {
        main: "#F00",
      },
      background: {
        default: "#222222",
      },
    },
  });

  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAPIEndpoint(event.target.value); // update the selected model
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name);
      setFileToUpload(file);
    }
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      if (mediaRecorder) {
        mediaRecorder.stop();
        console.log("Recording stopped.");
      }
      setIsRecording(false);
    } else {
      setTranscribedText("");
      console.log("Recording started...");
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const recorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks);

          const formData = new FormData();
          formData.append("audio", audioBlob);
          console.log("Processing voice input...");
          const response = await fetch(selectedAPIEndpoint, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            console.error("Upload failed");
            return;
          }

          const data = await response.json();
          const transcribedText = data.text;
          setTranscribedText(transcribedText);
          speechSynthesis.cancel();
          // speakText(transcribedText);

          if (
            selectedAPIEndpoint ===
            "http://localhost:3001/api/upload-audio-to-code"
          ) {
            setHtmlToOutput(transcribedText);
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      });
    }
  };

  const handleReviewCall = async () => {
    console.log("Uploading call for review...");
    if (fileToUpload) {
      const formData = new FormData();
      formData.append("audio", fileToUpload);
      console.log("Processing call...");
      const response = await fetch(selectedAPIEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Upload failed");
        return;
      }

      const data = await response.json();
      const transcribedText = data.text;
      setTranscribedText(transcribedText);
    }
  };
  return (
    <ThemeProvider theme={theme}>
      <Container
        style={{
          color: "#fff",
          backgroundColor: "#222",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <TextField
          id="transcribed-text"
          multiline
          rows={20}
          variant="outlined"
          value={transcribedText} // Set the value to the transcribed text
          fullWidth
          InputProps={{
            readOnly: true, // Make the field read-only
          }}
          style={{
            backgroundColor: "#DDD",
            color: "#fff",
            marginBottom: "10px",
          }}
        />
        <RadioGroup
          row
          value={selectedAPIEndpoint}
          onChange={handleModelChange}
        >
          <FormControlLabel
            value="http://localhost:3001/api/upload-audio"
            control={<Radio />}
            label="GPT-3"
          />
          <FormControlLabel
            value="http://localhost:3001/api/upload-audio-35"
            control={<Radio />}
            label="GPT-3.5"
          />
          <FormControlLabel
            value="http://localhost:3001/api/upload-audio-to-code"
            control={<Radio />}
            label="Code"
          />
          <FormControlLabel
            value="http://localhost:3001/api/upload-audio-call-review"
            control={<Radio />}
            label="Call Review"
          />
        </RadioGroup>
        {selectedAPIEndpoint !==
        "http://localhost:3001/api/upload-audio-call-review" ? (
          <Button
            variant="contained"
            color={isRecording ? "secondary" : "primary"}
            onClick={handleRecordingToggle} // Use the new function here
            endIcon={isRecording ? <StopIcon /> : <MicIcon />}
            fullWidth
          >
            {isRecording ? "Stop Recording" : "Record"}
          </Button>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button variant="contained" color="primary" component="label">
              Select File
              <input type="file" hidden onChange={handleFileUpload} />
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleReviewCall}
            >
              Review Call
            </Button>
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: htmlToOutput }} />
      </Container>
    </ThemeProvider>
  );
};

export default App;
