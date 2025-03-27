import React, { useState } from "react";
import { uploadData, getUrl } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
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
          setFileList((prev) => [...prev, filePath]); 
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
    <div className="container py-4 d-flex flex-column justify-content-center align-items-center min-vh-100">
  
    <div className="d-flex justify-content-between align-items-center w-75 mb-4">
      <h1 className="text-center flex-grow-1">Welcome, to your S3 Storage Upload!</h1>
      <button className="btn btn-danger ms-3" onClick={signOut}>Sign Out</button>
    </div>
  
    
    <div className="card p-4 shadow-sm mb-4 w-50">
      <h2 className="text-center">Upload a File</h2>
      <div className="input-group mb-3">
        <input type="file" className="form-control" onChange={handleFileChange} />
        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
          {uploading ? `Uploading... ${progress}%` : "Upload"}
        </button>
      </div>
  
      {uploading && (
        <div className="progress mt-2">
          <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}
    </div>
  
    
    <h2 className="mb-3">Uploaded Files</h2>
    <div className="row justify-content-center w-50">
      {fileList.map((filePath, index) => (
        <div key={index} className="col-md-6">
          <div className="card p-3 shadow-sm mb-3 text-center">
            <p className="mb-2">{filePath.split("/").pop()}</p>
            <button className="btn btn-success w-100" onClick={() => handleDownload(filePath)}>
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
}

export default withAuthenticator(App);