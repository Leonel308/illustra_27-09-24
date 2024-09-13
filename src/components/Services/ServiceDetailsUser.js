import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import '../../Styles/ServiceDetailsUser.css';

const ServiceDetailsUser = () => {
  const { user } = useContext(UserContext);
  const { requestId } = useParams(); // Eliminado illustratorHiredId
  const navigate = useNavigate();

  const [serviceDetails, setServiceDetails] = useState(null);
  const [illustratorHiredId, setIllustratorHiredId] = useState(null); // Nuevo estado
  const [fetchError, setFetchError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true); // Para manejar la carga del UserContext

  useEffect(() => {
    console.log('useEffect triggered: Verificando si user está disponible');
    if (!user) {
      // Si el contexto del usuario aún no está listo, esperamos
      setLoadingUser(true);
      console.log("Esperando a que se cargue el usuario...");
      return;
    }

    console.log("Usuario cargado:", user);

    // Función para obtener los detalles del servicio
    const fetchServiceDetails = async () => {
      if (user && requestId) {  
        try {
          console.log("Obteniendo detalles del servicio para requestId:", requestId);
          const serviceRef = doc(db, 'users', user.uid, 'ServiceHired', requestId);
          const serviceDoc = await getDoc(serviceRef);

          if (serviceDoc.exists()) {
            const serviceData = serviceDoc.data();
            console.log("Detalles del servicio obtenidos:", serviceData);
            setServiceDetails(serviceData);
            setIllustratorHiredId(serviceData.illustratorHiredId); // Establecer illustratorHiredId
          } else {
            console.log("No se encontraron los detalles del servicio para requestId:", requestId);
            setFetchError('No se encontraron los detalles del servicio.');
          }
        } catch (error) {
          console.error('Error al obtener los detalles del servicio:', error);
          setFetchError('Hubo un error al obtener los detalles del servicio.');
        } finally {
          setLoadingUser(false); // Finalizar la carga
        }
      } else {
        console.log("Faltan datos para obtener los detalles del servicio:", { user, requestId });
        setFetchError('Faltan datos necesarios para obtener los detalles del servicio.');
        setLoadingUser(false); // Finalizar la carga
      }
    };

    fetchServiceDetails();

  }, [user, requestId]);

  // Función para descargar los archivos
  const handleDownloadFiles = async () => {
    console.log('Intentando descargar archivos...');
    if (serviceDetails && serviceDetails.completedImages) {
      for (const [index, file] of serviceDetails.completedImages.entries()) {
        try {
          const response = await fetch(file);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `Trabajo_${index + 1}.${blob.type.split('/')[1]}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          console.log(`Archivo descargado: Trabajo_${index + 1}`);
        } catch (error) {
          console.error('Error al descargar el archivo:', error);
          alert('Hubo un error al descargar uno de los archivos.');
        }
      }
    } else {
      console.log('No hay archivos disponibles para descargar.');
      alert('No hay archivos disponibles para descargar.');
    }
  };

  // Función para aceptar la entrega
  const handleAcceptDelivery = async () => {
    console.log("Intentando aceptar la entrega...");
    console.log("illustratorHiredId:", illustratorHiredId, "requestId:", requestId);

    if (!illustratorHiredId || !requestId) {
      console.error("Faltan datos de illustratorHiredId o requestId.");
      setFetchError('Datos insuficientes para procesar la entrega.');
      return;
    }

    const confirmAccept = window.confirm(
      '¿Estás seguro de que deseas aceptar la entrega de este servicio?'
    );
    if (!confirmAccept) return;

    setIsAccepting(true);

    try {
      console.log("Obteniendo datos del ilustrador con ID:", illustratorHiredId);
      const illustratorRef = doc(db, 'users', illustratorHiredId);
      const illustratorDoc = await getDoc(illustratorRef);
      const illustratorData = illustratorDoc.data();
      console.log("Datos del ilustrador:", illustratorData);

      console.log("Obteniendo datos del cliente con ID:", user.uid);
      const clientRef = doc(db, 'users', user.uid);
      const clientDoc = await getDoc(clientRef);
      const clientData = clientDoc.data();
      console.log("Datos del cliente:", clientData);

      // Transferir fondos del pendingBalance al balance del ilustrador
      if (illustratorData && clientData && serviceDetails) {
        console.log('Transfiriendo fondos...');
        await updateDoc(illustratorRef, {
          balance: (illustratorData.balance || 0) + serviceDetails.servicePrice,
        });
        console.log('Balance del ilustrador actualizado.');

        await updateDoc(clientRef, {
          pendingBalance: (clientData.pendingBalance || 0) - serviceDetails.servicePrice,
        });
        console.log('PendingBalance del cliente actualizado.');

        // Mover el servicio a la subcolección "servicesCompleted"
        await moveToServicesCompleted();
        console.log('Servicio movido a servicesCompleted.');

        // Actualizar el estado del servicio
        await updateServiceStatus();
        console.log('Estado del servicio actualizado a "completed".');

        alert('Entrega aceptada. Los fondos han sido transferidos.');
        navigate(`/workbench`);
      } else {
        console.log('No se pudieron recuperar los datos necesarios para aceptar la entrega.');
        setFetchError('No se pudieron recuperar los datos necesarios para aceptar la entrega.');
      }
    } catch (error) {
      console.error('Error al aceptar la entrega:', error);
      setFetchError('Hubo un error al aceptar la entrega. Inténtelo de nuevo.');
    } finally {
      setIsAccepting(false);
    }
  };

  // Función para mover los detalles del servicio a la subcolección "servicesCompleted"
  const moveToServicesCompleted = async () => {
    try {
      console.log('Moviendo detalles del servicio a la subcolección "servicesCompleted"...');
      const clientServiceRef = doc(db, 'users', user.uid, 'ServiceHired', requestId);
      const illustratorServiceRef = doc(db, 'users', illustratorHiredId, 'ServiceRequests', requestId);

      const clientServiceDoc = await getDoc(clientServiceRef);
      const illustratorServiceDoc = await getDoc(illustratorServiceRef);

      if (clientServiceDoc.exists() && illustratorServiceDoc.exists()) {
        const clientServiceData = clientServiceDoc.data();
        const illustratorServiceData = illustratorServiceDoc.data();
        console.log('Datos obtenidos para servicesCompleted:', clientServiceData, illustratorServiceData);

        // Guardar en la subcolección "servicesCompleted" para ambas partes
        await setDoc(doc(db, `users/${user.uid}/servicesCompleted`, requestId), {
          ...clientServiceData,
          completedAt: new Date(),
          status: 'completed',
        });
        console.log('Documento creado en servicesCompleted para el cliente.');

        await setDoc(doc(db, `users/${illustratorHiredId}/servicesCompleted`, requestId), {
          ...illustratorServiceData,
          completedAt: new Date(),
          status: 'completed',
        });
        console.log('Documento creado en servicesCompleted para el ilustrador.');

        // Eliminar los registros antiguos de "ServiceHired" y "ServiceRequests"
        await deleteDoc(clientServiceRef);
        console.log('Documento eliminado de ServiceHired para el cliente.');

        await deleteDoc(illustratorServiceRef);
        console.log('Documento eliminado de ServiceRequests para el ilustrador.');
      } else {
        console.log('Uno o ambos documentos no existen en ServiceHired o ServiceRequests.');
        throw new Error('Documentos necesarios no existen.');
      }
    } catch (error) {
      console.error('Error al mover el servicio a la subcolección servicesCompleted:', error);
      throw error; // Re-throw para manejar en la función principal
    }
  };

  // Función para actualizar el estado del servicio a 'completed'
  const updateServiceStatus = async () => {
    try {
      console.log('Actualizando el estado del servicio a "completed"...');
      const clientServiceRef = doc(db, 'users', user.uid, 'servicesCompleted', requestId);
      const illustratorServiceRef = doc(db, 'users', illustratorHiredId, 'servicesCompleted', requestId);

      await updateDoc(clientServiceRef, {
        status: 'completed',
      });
      console.log('Estado del servicio en servicesCompleted del cliente actualizado a "completed".');

      await updateDoc(illustratorServiceRef, {
        status: 'completed',
      });
      console.log('Estado del servicio en servicesCompleted del ilustrador actualizado a "completed".');
    } catch (error) {
      console.error('Error al actualizar el estado del servicio:', error);
      // Opcional: Manejar el error según sea necesario
    }
  };

  if (loadingUser) {
    return <p>Cargando datos del usuario...</p>; // Mostrar mensaje de carga si user aún no está listo
  }

  if (fetchError) {
    console.log('Error de fetch:', fetchError);
    return <p className="error-message">{fetchError}</p>;
  }

  if (!serviceDetails) {
    console.log('Cargando detalles del servicio...');
    return <p>Cargando detalles del servicio...</p>;
  }

  // Determinar si el trabajo ha sido entregado
  const isDelivered = serviceDetails.status === 'delivered' || serviceDetails.status === 'completed';

  return (
    <div className="service-details-container">
      <h2>Detalles del Servicio</h2>
      {/* Sección de Detalles del Servicio */}
      <div className="service-details-content">
        <div className="service-details-info">
          <p className="price">Precio: ${serviceDetails.servicePrice}</p>
          <h3>{serviceDetails.serviceTitle}</h3>
          <h4>Descripción del Servicio:</h4>
          <p>{serviceDetails.serviceDescription}</p>
        </div>

        {/* Sección de Detalles del Pedido */}
        <div className="service-details-request">
          <h3>Detalles de tu Pedido</h3>
          <h4>Descripción de tu Pedido:</h4>
          <p>{serviceDetails.description}</p>
          {serviceDetails.files && serviceDetails.files.length > 0 && (
            <>
              <h4>Imágenes de Referencia que Proporcionaste:</h4>
              <div className="images-container">
                {serviceDetails.files.map((file, index) => (
                  <div key={index} className="image-item">
                    <img src={file} alt={`Referencia ${index + 1}`} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mostrar mensaje si el trabajo no ha sido entregado */}
        {!isDelivered ? (
          <div className="waiting-message">
            <p>📌 El freelancer está trabajando en tu pedido. Por favor, espera a que se complete la entrega.</p>
          </div>
        ) : (
          <>
            {/* Sección de Trabajo Entregado */}
            <div className="service-details-delivery">
              {serviceDetails.comment && (
                <>
                  <h4>Comentario del Trabajador:</h4>
                  <p>{serviceDetails.comment}</p>
                </>
              )}
              <h4>Trabajo Entregado:</h4>
              <div className="images-container">
                {serviceDetails.completedImages &&
                  serviceDetails.completedImages.map((file, index) => (
                    <div key={index} className="image-item">
                      <img src={file} alt={`Trabajo ${index + 1}`} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="actions-container">
              <button onClick={handleDownloadFiles} className="download-button">
                Descargar Archivos
              </button>
              <button
                onClick={handleAcceptDelivery}
                className="accept-button"
                disabled={isAccepting}
              >
                {isAccepting ? 'Aceptando...' : 'Aceptar Entrega'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailsUser;
