import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import { AlertCircle, Upload } from "lucide-react";
import '../../Styles/ServiceDetailsWorker.css';

export default function ServiceDetailsWorker() {
  const { user, loading } = useContext(UserContext);
  const { requestId, clientId } = useParams();
  const navigate = useNavigate();
  const [serviceDetails, setServiceDetails] = useState(null);
  const [completedImages, setCompletedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [comment, setComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (user && !loading) {
        try {
          const serviceRef = doc(db, 'users', user.uid, 'ServiceRequests', requestId);
          const serviceDoc = await getDoc(serviceRef);

          if (serviceDoc.exists()) {
            setServiceDetails(serviceDoc.data());
          } else {
            setFetchError('No se encontraron los detalles del servicio.');
          }
        } catch (error) {
          console.error('Error al obtener los detalles del servicio:', error);
          setFetchError('Hubo un error al obtener los detalles del servicio.');
        }
      }
    };

    fetchServiceDetails();
  }, [user, loading, requestId]);

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (completedImages.length + selectedFiles.length > 10) {
      alert('Solo puedes subir un máximo de 10 imágenes.');
      return;
    }
    setCompletedImages((prevImages) => [...prevImages, ...selectedFiles]);
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewImages((prevPreviews) => [...prevPreviews, ...previewUrls]);
  };

  const handleImageClick = (src) => {
    setModalImage(src);
  };

  const handleModalClose = () => {
    setModalImage(null);
  };

  const handleSubmit = async () => {
    if (completedImages.length === 0) {
      alert('Por favor, sube al menos una imagen del trabajo completado.');
      return;
    }
    setSubmitLoading(true);
    try {
      const uploadedFiles = await Promise.all(
        completedImages.map(async (file) => {
          const fileRef = ref(storage, `completed-services/${user.uid}/${file.name}`);
          await uploadBytes(fileRef, file);
          return await getDownloadURL(fileRef);
        })
      );

      const serviceRef = doc(db, 'users', user.uid, 'ServiceRequests', requestId);
      const clientServiceRef = doc(db, 'users', clientId, 'ServiceHired', requestId);

      const updateData = {
        completedImages: uploadedFiles,
        status: 'delivered',
        comment,
      };

      await updateDoc(serviceRef, updateData);
      await updateDoc(clientServiceRef, updateData);

      const notificationsRef = collection(db, 'users', clientId, 'Notifications');
      await addDoc(notificationsRef, {
        message: `El servicio "${serviceDetails.serviceTitle}" ha sido completado y está pendiente de tu confirmación.`,
        timestamp: new Date(),
        read: false,
      });

      alert('Trabajo entregado con éxito. Esperando confirmación del cliente.');
      navigate(`/workbench`);
    } catch (error) {
      console.error('Error al subir el trabajo:', error);
      setFetchError('Hubo un error al subir el trabajo. Inténtelo de nuevo.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.')) {
      return;
    }
    setCancelLoading(true);
    try {
      const serviceRef = doc(db, 'users', user.uid, 'ServiceRequests', requestId);
      const clientServiceRef = doc(db, 'users', clientId, 'ServiceHired', requestId);

      await deleteDoc(serviceRef);
      await deleteDoc(clientServiceRef);

      const notificationsRef = collection(db, 'users', clientId, 'Notifications');
      await addDoc(notificationsRef, {
        message: `El servicio "${serviceDetails.serviceTitle}" ha sido cancelado por el trabajador.`,
        timestamp: new Date(),
        read: false,
      });

      const paymentRef = doc(db, 'users', clientId, 'Payments', serviceDetails.paymentId);
      await updateDoc(paymentRef, {
        status: 'cancelled',
      });

      const clientRef = doc(db, 'users', clientId);
      const clientDoc = await getDoc(clientRef);
      const clientData = clientDoc.data();

      await updateDoc(clientRef, {
        balance: clientData.balance + serviceDetails.servicePrice,
        pendingBalance: clientData.pendingBalance - serviceDetails.servicePrice,
      });

      alert('El pedido ha sido cancelado y el saldo ha sido devuelto.');
      navigate(`/workbench`);
    } catch (error) {
      console.error('Error al cancelar el pedido:', error);
      setFetchError('Hubo un error al cancelar el pedido. Inténtelo de nuevo.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (fetchError) {
    return (
      <div className="alert error">
        <span className="alert-icon"><AlertCircle /></span>
        <div>
          <h4 className="alert-title">Error</h4>
          <p className="alert-description">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (!serviceDetails) {
    return <p className="text-center">Cargando detalles del servicio...</p>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Detalles del Servicio para Trabajador</h2>
        <p>Gestiona y entrega el trabajo solicitado</p>
      </div>
      <div className="card-content">
        <div className="service-summary">
          <div>
            <h3>{serviceDetails.serviceTitle}</h3>
            <p className="service-description">{serviceDetails.description}</p>
          </div>
          <p className="service-price">${serviceDetails.servicePrice}</p>
        </div>

        <div>
          <h4>Imágenes Subidas por el Cliente</h4>
          <div className="uploaded-images">
            {serviceDetails.files && serviceDetails.files.map((file, index) => (
              <img
                key={index}
                src={file}
                alt={`Cliente imagen ${index + 1}`}
                className="uploaded-image"
                onClick={() => handleImageClick(file)}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comentario del Trabajo</label>
          <textarea
            id="comment"
            placeholder="Describe el trabajo realizado..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={360}
            rows={5}
            className="textarea"
          />
        </div>

        <div className="form-group">
          <label htmlFor="file-upload">Subir Trabajo Completado</label>
          <div className="file-input-wrapper">
            <input id="file-upload" type="file" multiple accept="image/*" onChange={handleFilesChange} className="file-input" />
            <span className="file-upload-icon"><Upload /></span>
          </div>
        </div>

        {previewImages.length > 0 && (
          <div>
            <h4>Vista previa</h4>
            <div className="preview-images">
              {previewImages.map((image, index) => (
                <img key={index} src={image} alt={`Preview ${index + 1}`} className="preview-image" />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="card-footer">
        <button className="button button-cancel" onClick={handleCancel} disabled={cancelLoading}>
          {cancelLoading ? 'Cancelando...' : 'Cancelar Pedido'}
        </button>
        <button className="button button-submit" onClick={handleSubmit} disabled={submitLoading}>
          {submitLoading ? 'Enviando...' : 'Entregar Trabajo'}
        </button>
      </div>

      {modalImage && (
        <div className="modal" onClick={handleModalClose}>
          <span className="modal-close">&times;</span>
          <img className="modal-content" src={modalImage} alt="Expanded view" />
        </div>
      )}
    </div>
  );
}
