import React, { useState, useEffect } from "react";
import { uploadData, getUrl, list } from "aws-amplify/storage";
import { Amplify} from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { FaFolder, FaFile, FaDownload, FaArrowLeft } from "react-icons/fa";
import "@aws-amplify/ui-react/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import awsExports from "./aws-exports";

Amplify.configure(awsExports);

function App({ signOut, user }) {
  const [file, setFile] = useState(null);
  const [folder, setFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [currentPath, setCurrentPath] = useState("uploads/");
  const [presignedUrl, setPresignedUrl] = useState("");

  useEffect(() => {
    fetchFileList();
  }, [currentPath]);





  const fetchFileList = async () => {
    try {
      const result = await list({ path: currentPath });
      const { files, folders } = processStorageList(result);
      setFileList([...folders, ...files.map((file) => file.path)]);
    } catch (error) {
      console.error("Error fetching file list:", error);
    }
  };

  function processStorageList(response) {
    let files = [];
    let folders = new Set();
    response.items.forEach((res) => {
      if (res.size) {
        files.push(res);
        let possibleFolder = res.path.split("/").slice(0, -1).join("/");
        if (possibleFolder) folders.add(possibleFolder + "/");
      } else {
        folders.add(res.path);
      }
    });
    return { files, folders: [...folders] };
  }

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFolderChange = (event) => {
    setFolder(event.target.value);
  };

  const getVersionedFileName = (existingFiles, fileName) => {
    if (!existingFiles.includes(fileName)) return fileName;

    let nameWithoutExt = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    let extension = fileName.split(".").pop();
    let counter = 1;

    while (existingFiles.includes(`${nameWithoutExt}(${counter}).${extension}`)) {
      counter++;
    }
    return `${nameWithoutExt}(${counter}).${extension}`;
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setUploading(true);

    try {
      let folderPath = folder ? `${currentPath}${folder}/` : currentPath;
      let existingFiles = fileList.map((f) => f.split("/").pop());
      let fileName = getVersionedFileName(existingFiles, file.name);
      let filePath = `${folderPath}${fileName}`;

      console.log(`Uploading to: ${filePath}`);

      await uploadData({
        data: await file.arrayBuffer(),
        path: filePath,
      });

      alert("File uploaded successfully!");
      fetchFileList();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleNavigateToFolder = (folderName) => {
    setCurrentPath(`${currentPath}${folderName}/`);
  };

  const handleGoBack = () => {
    if (currentPath !== "uploads/") {
      let newPath = currentPath.split("/").slice(0, -2).join("/") + "/";
      setCurrentPath(newPath || "uploads/");
    }
  };

  const handleDownload = async (filePath) => {
    try {
        const urlObject = await getUrl({ path: filePath, options: { expiresIn: 300 } }); 
        const url = urlObject.url || urlObject; 

        setPresignedUrl(url); 

        // Trigger a download
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filePath.split("/").pop();
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    } catch (error) {
        console.error("Error generating download link:", error);
        alert("Download failed!");
    }
};

  return (
    <div className="container text-center mt-4">
      <h1>Welcome, {user.signInDetails.loginId}!</h1>
      <button className="btn btn-danger mb-3" onClick={signOut}>
        Sign Out
      </button>

      <h2>Create a Folder / Upload a File</h2>
      <input type="text" placeholder="Folder Name (optional)" onChange={handleFolderChange} className="form-control mb-2" />
      <input type="file" onChange={handleFileChange} className="form-control mb-2" />
      <button onClick={handleUpload} disabled={uploading} className="btn btn-primary mb-3">
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {currentPath !== "uploads/" && (
        <button onClick={handleGoBack} className="btn btn-secondary mb-3">
          <FaArrowLeft className="me-1" /> Go Back
        </button>
      )}

      <h2>Files & Folders</h2>
      <ul className="list-group">
        {fileList.length === 0 ? (
          <li className="list-group-item">No files found.</li>
        ) : (
          fileList.map((filePath, index) => {
            const fileName = filePath.split("/").filter(Boolean).pop();
            const isFolder = filePath.endsWith("/");

            return (
              <li key={index} className="list-group-item d-flex align-items-center justify-content-between">
                {isFolder ? (
                  <button onClick={() => handleNavigateToFolder(fileName)} className="btn btn-link text-dark">
                    <FaFolder className="me-2 text-warning" /> {fileName}
                  </button>
                ) : (
                  <span>
                    <FaFile className="me-2 text-primary" /> {fileName}
                  </span>
                )}
                {!isFolder && (
                  <button onClick={() => handleDownload(filePath)} className="btn btn-sm btn-success">
                    <FaDownload className="me-1" /> Download
                  </button>
                )}
              </li>
            );
          })
        )}
      </ul>

      {presignedUrl && (
        <div className="mt-3">
          <h5>Presigned URL:</h5>
          <textarea className="form-control" rows="2" readOnly value={presignedUrl}></textarea>
        </div>
      )}
    </div>
  );
}

export default withAuthenticator(App);