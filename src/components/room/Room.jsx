// Import necessary modules and components
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode.react";
import { readAndCompressImage } from "browser-image-resizer";
import styles from "./Room.module.css"; // Import CSS module
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { db, storage } from "../../firebase"; // Import Firebase Firestore and Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  addDoc,
} from "firebase/firestore";
import { useCopyToClipboard } from "../../utils/copy2clipboard"; // Import the custom hook

const Room = () => {
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [uploadedFileURLs, setUploadedFileURLs] = useState([]);
  const [isSliderVisible, setIsSliderVisible] = useState(true);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [showUploadFormUser, setShowUploadFormUser] = useState(false);
  const [showUploadFormAdmin, setShowUploadFormAdmin] = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const { copyToClipboard, showTooltip } = useCopyToClipboard();

  useEffect(() => {
    // Fetch room details from Firestore using the new API
    const roomRef = doc(db, "rooms", id); // Get a reference to the document
    getDoc(roomRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setRoomDetails(docSnap.data());
          setIsAdmin(
            docSnap.data().admin_username === localStorage.getItem("username")
          );
        } else {
          setError("No such document!");
        }
      })
      .catch((error) => {
        console.error("Error fetching room details:", error);
        setError(error.message);
      });
  }, [id]);

  useEffect(() => {
    if (!isAdmin) {
      // Fetch images for the room using the new Firestore v9 modular API
      const userImagesRef = collection(db, "rooms", id, "Admin_Images"); // Correctly reference the subcollection
      const qUserImages = query(userImagesRef); // Create a query against the collection if needed

      getDocs(qUserImages)
        .then((querySnapshot) => {
          const urls = [];
          querySnapshot.forEach((docSnap) => {
            urls.push(docSnap.data().url); // Assuming 'url' is the correct field
          });
          setUploadedFileURLs(urls);
        })
        .catch((error) => {
          console.error("Error fetching user images:", error);
        });

      // Fetch job descriptions for the room using the new Firestore v9 modular API
      const jobsRef = collection(db, "rooms", id, "jobs"); // Correctly reference the subcollection
      const qJobs = query(jobsRef); // Create a query against the collection if needed

      getDocs(qJobs)
        .then((querySnapshot) => {
          const jobs = [];
          querySnapshot.forEach((docSnap) => {
            jobs.push(docSnap.data().job_description); // Assuming 'job_description' is the correct field
          });
          setJobDescriptions(jobs);
        })
        .catch((error) => {
          console.error("Error fetching job descriptions:", error);
        });
    }
  }, [id, isAdmin, setUploadedFileURLs, setJobDescriptions]);

  function handleChange(event) {
    const filesArray = Array.from(event.target.files);
    const config = {
      quality: 0.75,
      maxWidth: 1920,
      maxHeight: 1080,
      autoRotate: true,
    };
    Promise.all(filesArray.map((file) => readAndCompressImage(file, config)))
      .then((resizedImages) => {
        setFiles(
          resizedImages.map((blob, i) => ({ blob, name: filesArray[i].name }))
        );
      })
      .catch((err) => {
        console.error("Error in image processing:", err);
      });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!files.length) {
      return;
    }

    const uploaderUsername = localStorage.getItem("username");

    if (isAdmin) {
      // Xử lý tải ảnh cho admin
      files.forEach((file) => {
        const imageRef = ref(storage, `images/${id}/${file.name}`);
        uploadBytes(imageRef, file.blob).then((snapshot) => {
          console.log("Uploaded a blob or file!");
          getDownloadURL(snapshot.ref).then((downloadURL) => {
            setUploadedFileURLs((prevUrls) => [...prevUrls, downloadURL]);

            const imagesRef = collection(db, "rooms", id, "Admin_Images");
            const imageDoc = {
              uploader_username: uploaderUsername,
              url: downloadURL,
            };

            // Thêm link ảnh vào Firestore
            addDoc(imagesRef, imageDoc)
              .then(() => {
                console.log("Image URL added to Admin_Images");
              })
              .catch((error) => {
                console.error("Error adding image URL: ", error);
              });
          });
        });
      });
      // Nếu người dùng là admin, thêm mô tả công việc vào jobs
      const description = event.target.querySelector("textarea").value;
      const job = { job_description: description };
      const jobsRef = collection(db, "rooms", id, "jobs");
      addDoc(jobsRef, job)
        .then((docRef) => {
          console.log("Job description uploaded with ID: ", docRef.id);
          setJobDescriptions((prevJobs) => [...prevJobs, description]);
          setShowUploadFormAdmin(false);
          alert("Job Upload successfully!");
        })
        .catch((error) => {
          console.error("Error adding job description: ", error);
        });
    } else {
      // Xử lý tải ảnh cho user
      files.forEach((file) => {
        const imageRef = ref(storage, `images/${id}/${file.name}`);
        uploadBytes(imageRef, file.blob).then((snapshot) => {
          console.log("Uploaded a blob or file!");
          getDownloadURL(snapshot.ref).then((downloadURL) => {
            setUploadedFileURLs((prevUrls) => [...prevUrls, downloadURL]);

            const userDocRef = doc(
              db,
              "rooms",
              id,
              "User_Images",
              uploaderUsername
            );
            const imagesCollectionRef = collection(userDocRef, "images");
            const imageDoc = {
              url: downloadURL,
              // Add other image metadata here as needed
            };

            addDoc(imagesCollectionRef, imageDoc)
              .then(() => {
                console.log(
                  "Image document added under user's images collection"
                );
                setShowUploadFormUser(false);
                alert("Job submitted successfully!");
              })
              .catch((error) => {
                console.error("Error adding image document: ", error);
              });
          });
        });
      });
    }
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!roomDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.bg_room}>
      <h1 className={styles.roomTitle}>Welcome to room {id}</h1>
      {isAdmin ? (
        <>
          {/* Admin view */}
          <div className={styles.adminView}>
            <button
              className={styles.shareButton}
              onClick={() => setShowRoomInfo(true)}
            >
              Share
            </button>
            <button
              className={styles.shareButton}
              onClick={() => setShowUploadFormAdmin(true)}
            >
              Submit Job
            </button>
          </div>
          {showRoomInfo && (
            <div className={styles.roomInfo}>
              <button
                className={styles.closeButton}
                onClick={() => setShowRoomInfo(false)}
              >
                X
              </button>
              <br />
              <p className={styles.roomLink}>
                Room Link:{" "}
                <a href={window.location.href}>{window.location.href}</a>
                <br />
                Scan QR code to join the room
              </p>
              <br />
              <div className={styles.qrCode}>
                <QRCode value={window.location.href} />
              </div>
              <button
                className={styles.copyButton}
                onClick={() => copyToClipboard(window.location.href)}
              >
                Copy Link
              </button>
              {showTooltip && <span className={styles.tooltip}>Copied to Clipboard!</span>}
            </div>
          )}
          {showUploadFormAdmin && ( // Use the state variable to conditionally render this form
            <form className={styles.uploadForm} onSubmit={handleSubmit}>
              <h1>Misson Upload</h1>
              <button // Close button to hide the form
                className={styles.closeButton}
                onClick={() => setShowUploadFormAdmin(false)}
              >
                X
              </button>
              <input
                type="file"
                onChange={handleChange}
                className={styles.fileInput}
                multiple
              />
              <br />
              <textarea
                placeholder="Description"
                className={styles.descriptionInput}
              />
              <br />
              <button type="submit" className={styles.uploadButton}>
                Upload
              </button>
            </form>
          )}
        </>
      ) : (
        <div className={styles.nonAdminView}>
          {/* Non-admin view */}
          <button
            className={styles.shareButton}
            onClick={() => setShowUploadFormUser(true)}
          >
            Submit Misson
          </button>
          {showUploadFormUser && (
            <form className={styles.uploadForm} onSubmit={handleSubmit}>
              <h1>Submit Job</h1>
              <input
                type="file"
                onChange={handleChange}
                className={styles.fileInput}
                multiple
              />
              <button
                className={styles.closeButton}
                onClick={() => setShowUploadFormUser(false)}
              >
                X
              </button>
              <br />
              <button type="submit" className={styles.uploadButton}>
                Submit
              </button>
            </form>
          )}
          <div>
            <h2>Your mission:</h2>
            {jobDescriptions.map((job, index) => (
              <div key={index}>
                <p>{job}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {uploadedFileURLs.length > 0 && (
        <div className={styles.sliderContainer}>
          <div></div>
          <br />
          {/* Slider for uploaded files */}
          {isAdmin && (
            <button
              className={styles.uploadButton}
              onClick={() => setIsSliderVisible(!isSliderVisible)}
            >
              {isSliderVisible ? "Hide" : "Show"} Slider
            </button>
          )}
          {(isAdmin ? isSliderVisible : true) && (
            <Slider
              {...{
                dots: true,
                infinite: uploadedFileURLs.length > 1,
                speed: 500,
                slidesToShow: 1,
                slidesToScroll: 1,
                responsive: [
                  {
                    breakpoint: 1920, // Màn hình rất lớn, không cần tải ảnh lớn hơn 1080p
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      infinite: uploadedFileURLs.length > 1,
                    },
                  },
                  {
                    breakpoint: 1440, // Màn hình lớn
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      infinite: uploadedFileURLs.length > 1,
                    },
                  },
                  {
                    breakpoint: 1280, // Màn hình máy tính trung bình
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      infinite: uploadedFileURLs.length > 1,
                    },
                  },
                  {
                    breakpoint: 1024, // Máy tính bảng lớn và màn hình máy tính nhỏ
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      infinite: uploadedFileURLs.length > 1,
                    },
                  },
                  {
                    breakpoint: 768, // Máy tính bảng
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      infinite: uploadedFileURLs.length > 1,
                    },
                  },
                  {
                    breakpoint: 600, // Máy tính bảng nhỏ
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      initialSlide: 1,
                      infinite: uploadedFileURLs.length > 1,
                    },
                  },
                  {
                    breakpoint: 480, // Điện thoại di động lớn
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      infinite: uploadedFileURLs.length > 1,
                    },
                  },
                  {
                    breakpoint: 320, // Điện thoại di động
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      infinite: uploadedFileURLs.length > 1,
                    },
                  },
                ],
              }}
            >
              {uploadedFileURLs.map((url, index) => (
                <div key={index}>
                  <img
                    src={url}
                    alt={`Uploaded content ${index + 1}`}
                    className={styles.uploadedImage}
                    style={{
                      width: "100%",
                      height: "auto",
                      maxWidth: "1920px", // Giữ nguyên giới hạn này vì ảnh có chất lượng tối đa là 1080p
                      maxHeight: "1080px",
                    }}
                  />
                </div>
              ))}
            </Slider>
          )}
        </div>
      )}

      {/* Message for non-admins when no content is available */}
      {!isAdmin && uploadedFileURLs.length === 0 && (
        <div className={styles.noContentMessage}>
          <p>No content has been shared in this room yet.</p>
          <p>
            Please check back later or ask the room admin to upload some
            content.
          </p>
        </div>
      )}
    </div>
  );
};

export default Room;
