import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TermsAndConditions.css';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="terms-container">
      <div className="terms-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <h1>📋 Términos y Condiciones - Efectivo Express</h1>
        <p className="terms-subtitle">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
      </div>

      <div className="terms-content">
        <section className="terms-section">
          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al utilizar el servicio de Efectivo Express, usted acepta estos términos y condiciones en su totalidad.
            Si no está de acuerdo con alguno de estos términos, no debe utilizar el servicio.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Descripción del Servicio</h2>
          <p>
            Efectivo Express es un servicio de transferencia de dinero que permite enviar efectivo a destinatarios
            dentro de Yutanducho de Guerrero, Oaxaca. El servicio incluye:
          </p>
          <ul>
            <li>Recepción de depósitos bancarios</li>
            <li>Validación de comprobantes de depósito</li>
            <li>Entrega de efectivo al destinatario en la ubicación designada</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. Zona de Cobertura</h2>
          <p>
            El servicio solo está disponible para entregas dentro de Yutanducho de Guerrero, Oaxaca.
            No realizamos entregas fuera de esta zona.
          </p>
        </section>

        <section className="terms-section">
          <h2>4. Comisiones y Montos</h2>
          <ul>
            <li>Se aplica una comisión sobre el monto a enviar</li>
            <li>El monto total a depositar incluye el monto a enviar más la comisión</li>
            <li>Los montos pueden redondearse hacia arriba para facilitar el depósito en efectivo</li>
            <li>Los montos máximos y mínimos están sujetos a la configuración del servicio</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>5. Proceso de Depósito</h2>
          <ul>
            <li>El usuario debe realizar el depósito en las cuentas bancarias proporcionadas</li>
            <li>El depósito debe realizarse en el monto exacto indicado (monto + comisión)</li>
            <li>El usuario es responsable de conservar su comprobante de depósito en buen estado</li>
            <li>El comprobante debe ser legible y mostrar claramente: monto, fecha y datos de la cuenta</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>6. Validación de Depósitos</h2>
          <ul>
            <li>Nos reservamos el derecho de validar cada depósito antes de proceder con la entrega</li>
            <li>Si no podemos identificar claramente el depósito en el comprobante, no nos hacemos responsables de la validación</li>
            <li>El usuario debe asegurarse de que la foto del comprobante sea clara y legible</li>
            <li>La validación puede tomar tiempo según la carga de trabajo</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>7. Horarios y Tiempos de Entrega</h2>
          <ul>
            <li>Los horarios de servicio están sujetos a la configuración y disponibilidad del servicio</li>
            <li>No se realizan entregas en días festivos o fuera del horario de servicio</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. Datos del Destinatario</h2>
          <ul>
            <li>El usuario debe proporcionar datos completos y correctos del destinatario</li>
            <li>Es responsabilidad del usuario informar al destinatario sobre la disponibilidad del dinero</li>
            <li>El destinatario debe presentarse en la ubicación designada para recoger el dinero</li>
            <li>El destinatario debe poder identificarse al momento de la entrega</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>9. Responsabilidades del Usuario</h2>
          <ul>
            <li>Proporcionar información veraz y completa</li>
            <li>Conservar el comprobante de depósito en buen estado</li>
            <li>Subir una foto clara y legible del comprobante</li>
            <li>Revisar regularmente "Mis Solicitudes" para el seguimiento de su solicitud</li>
            <li>Informar al destinatario sobre la disponibilidad del dinero</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>10. Limitaciones de Responsabilidad</h2>
          <ul>
            <li>No nos hacemos responsables si no podemos identificar el depósito debido a un comprobante ilegible o incompleto</li>
            <li>No nos hacemos responsables por retrasos causados por información incorrecta del usuario</li>
            <li>No nos hacemos responsables si el destinatario no se presenta a recoger el dinero</li>
            <li>El servicio está sujeto a disponibilidad y capacidad operativa</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>11. Cancelaciones y Reembolsos</h2>
          <ul>
            <li>Las solicitudes pueden ser canceladas antes de hacer el depósito en la cuenta</li>
            <li><strong>Una vez realizado el depósito en la cuenta, no hay reembolsos disponibles</strong></li>
            <li>Si el administrador rechaza el depósito, se notificará al usuario con las razones del rechazo</li>
            <li>En caso de rechazo, el usuario podrá corregir los datos o adjuntar nuevamente el comprobante de depósito</li>
            <li>El usuario debe asegurarse de que toda la información sea correcta antes de realizar el depósito</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>12. Privacidad y Seguridad</h2>
          <ul>
            <li>Los datos personales se manejan de acuerdo con nuestra política de privacidad</li>
            <li>No compartimos información personal con terceros sin consentimiento</li>
            <li>Los comprobantes de depósito se almacenan de forma segura</li>
            <li>El usuario es responsable de mantener la confidencialidad de su cuenta</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>13. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento.
            Los cambios serán notificados a través de la plataforma. El uso continuado del servicio
            después de los cambios constituye la aceptación de los nuevos términos.
          </p>
        </section>

        <section className="terms-section">
          <h2>14. Contacto</h2>
          <p>
            Para cualquier duda, consulta o reclamo relacionado con el servicio de Efectivo Express,
            puede contactarnos a través de los canales oficiales de Mini Super Curiel.
          </p> 
          <p>
            <strong>Comunicación y Soporte:</strong> La única forma de comunicación o soporte es mediante nuestro{' '}
            <a 
              href="https://www.facebook.com/minisuper.curiel/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-link"
            >
              Facebook oficial
            </a>
            {' '}de Mini Super Curiel.
          </p>
        </section>
      </div>

      <div className="terms-footer">
        <button className="accept-button" onClick={() => navigate(-1)}>
          Entendido
        </button>
      </div>
    </div>
  );
}

