import React, { useState } from "react";
import { uploadData, getUrl } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";

Amplify.configure(awsExports);

function App({ signOut, user }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileList, setFileList] = useState([]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);

      fileReader.onload = async (event) => {
        console.log("File read successfully!", event.target.result);

        try {
          const filePath = `uploads/${file.name}`;
          await uploadData({
            data: event.target.result,
            path: filePath,
            options: {
              onProgress: (progress) => {
                setProgress(Math.round((progress.transferredBytes / progress.totalBytes) * 100));
              },
            },
          });

          alert("File uploaded successfully!");
          setFileList((prev) => [...prev, filePath]); // Append new file path
        } catch (e) {
          console.error("Error uploading file:", e);
          alert("Upload failed!");
        } finally {
          setUploading(false);
          setProgress(0);
        }
      };
    } catch (e) {
      console.error("File read error:", e);
      setUploading(false);
    }
  };

  const handleDownload = async (path) => {
    try {
      const url = await getUrl({ path });
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Download failed!");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Welcome, {user?.username}!</h1>
      <button onClick={signOut}>Sign Out</button>

      <h2>Upload a File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? `Uploading... ${progress}%` : "Upload"}
      </button>

      {/* Upload Progress Bar */}
      {uploading && (
        <div style={{ marginTop: "10px", width: "300px", height: "10px", background: "#ddd" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "green" }}></div>
        </div>
      )}

      <h2>Uploaded Files</h2>
      <ul>
        {fileList.map((filePath, index) => (
          <li key={index}>
            {filePath} -{" "}
            <button onClick={() => handleDownload(filePath)}>Download</button>
            {filePath.endsWith(".png") || filePath.endsWith(".jpg") ? (
              <StorageImage path={filePath} alt="Uploaded file" width="100px" />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default withAuthenticator(App);