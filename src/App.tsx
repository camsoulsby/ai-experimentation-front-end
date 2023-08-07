import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const theme = createTheme({
    palette: {
      primary: {
        main: "#f44336",
      },
      background: {
        default: "#222222",
      },
    },
  });

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
          const response = await fetch(
            "http://localhost:3001/api/upload-audio",
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            console.error("Upload failed");
            return;
          }

          const data = await response.json();
          const transcribedText = data.text;
          setTranscribedText(transcribedText);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      });
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
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRecordingToggle} // Use the new function here
          endIcon={isRecording ? <StopIcon /> : <MicIcon />}
          fullWidth
        >
          {isRecording ? "Stop Recording" : "Record"}
        </Button>

        <TextField
          id="transcribed-text"
          multiline
          rows={4}
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
      </Container>
    </ThemeProvider>
  );
};

export default App;
