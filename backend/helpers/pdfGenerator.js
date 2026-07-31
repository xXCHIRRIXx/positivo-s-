const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Función auxiliar para generar un nombre de archivo limpio, estandarizado y con la fecha actual
 */
function generarNombreArchivo(tipo, inputData) {
    const tipoNormalizado = String(tipo).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const prefijo = tipoNormalizado.includes('asignacion') ? 'ACTA_ASIGNACION' : 'ACTA_DEVOLUCION';
    
    const nombreColaborador = (inputData.nombresColaborador || inputData.nombresCompletos || inputData.nombre || 'COLABORADOR')
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');

    const cedula = (inputData.identificacion || inputData.cedula || inputData.documento || 'SIN_CEDULA').trim();

    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaActual.getDate()).padStart(2, '0');
    const fechaFormateada = `${anio}-${mes}-${dia}`;

    return `${prefijo}_${nombreColaborador}_${cedula}_${fechaFormateada}.pdf`;
}

/**
 * Función para cargar el logo de forma segura en Base64 desde la misma carpeta helpers
 */
function obtenerLogoBase64() {
    const logoPath = path.join(__dirname, 'logo.png');
    if (fs.existsSync(logoPath)) {
        try {
            const logoBuffer = fs.readFileSync(logoPath);
            return `data:image/png;base64,${logoBuffer.toString('base64')}`;
        } catch (error) {
            console.error("Error al leer el logo.png:", error);
        }
    } else {
        console.warn("Advertencia: No se encontró el archivo logo.png en la ruta:", logoPath);
    }
    return '';
}

/**
 * Función auxiliar para generar las filas de equipos/implementos
 */
function generarFilasEquipos(equipos) {
    if (!equipos || equipos.length === 0) {
        return `
         <tr style="height:21.65pt">
          <td colspan="4" valign="top" style="border:solid black 2.0pt;border-top:none;padding:6px;text-align:center;">
          <p class="TableParagraph" align="center" style="text-align:center;"><span lang="ES">No se registraron implementos</span></p>
          </td>
         </tr>`;
    }

    let filas = '';
    equipos.forEach((item, index) => {
        const tipoModelo = `${item.tipo || 'Elemento'}${item.modelo ? ' - ' + item.modelo : ''}`;
        filas += `
         <tr style="height:21.65pt">
          <td width="178" valign="top" style="width:133.6pt;border:solid black 2.0pt;border-top:${index === 0 ? 'none' : 'solid 2.0pt'};padding:4px;">
          <p class="TableParagraph" align="center" style="text-align:center;"><b style="color: red; mso-bidi-font-weight:normal"><span lang="ES">${tipoModelo}</span></b></p>
          </td>
          <td width="128" valign="top" style="width:96.15pt;border:solid black 2.0pt;border-top:${index === 0 ? 'none' : 'solid 2.0pt'};border-left:none;padding:4px;">
          <p class="TableParagraph" align="center" style="text-align:center;"><span lang="ES">${item.serial || '&nbsp;'}</span></p>
          </td>
          <td width="67" valign="top" style="width:50.3pt;border:solid black 2.0pt;border-top:${index === 0 ? 'none' : 'solid 2.0pt'};border-left:none;padding:4px;">
          <p class="TableParagraph" align="center" style="text-align:center;"><b style="color: black; mso-bidi-font-weight:normal"><span lang="ES">${item.estado || 'Bueno'}</span></b></p>
          </td>
          <td width="246" valign="top" style="width:184.75pt;border:solid black 2.0pt;border-top:${index === 0 ? 'none' : 'solid 2.0pt'};border-left:none;padding:4px;">
          <p class="TableParagraph" align="center" style="text-align:center;"><span lang="ES">${item.observacion || item.observaciones || 'Sin observaciones'}</span></p>
          </td>
         </tr>
        `;
    });
    return filas;
}

/**
 * Plantilla HTML unificada que construye el contenido completo según el tipo de acta
 */
function construirHtmlActa(tipoActa, data, logoSrc, filasEquiposHtml) {
    const esAsignacion = tipoActa.includes('asignacion');
    const asuntoTexto = esAsignacion ? 'ASIGNACIÓN' : 'DEVOLUCIÓN';

    // Párrafos específicos de introducción para Asignación (si aplica)
    const htmlIntroduccionAsignacion = esAsignacion ? `
        <p class="MsoBodyText" style="margin-top:14px;margin-right:37.8pt;margin-bottom:12px;margin-left:16.9pt;text-align:justify;line-height:115%;">
        <span lang="ES">Con el objetivo de mantener un adecuado control de los activos, herramientas e implementos que son propiedad de POSITIVO S+ IT SOLUTIONS S.AS y que han sido entregados para la gestión de su labor, se informa que absolutamente, todos los movimientos (cambios, ingresos o salidas), deberán ser notificados sin falta y con la debida oportunidad al área de Service Desk o si es línea celular o móvil al área Administrativa y Financiera.</span>
        </p>

        <p class="MsoBodyText" style="margin-top:14px;margin-right:37.8pt;margin-bottom:12px;margin-left:16.9pt;text-align:justify;line-height:115%;">
        <span lang="ES">Adicionalmente cualquier cambio de ubicación o dependencia debe ser reportado al área de Service Desk, para que este toma decisiones sobre la reubicación del elemento. Importante: El área de Service Desk puede disponer del elemento en cualquier momento.</span>
        </p>
    ` : '';

    // Párrafo de introducción para Devolución (si aplica)
    const htmlIntroduccionDevolucion = !esAsignacion ? `
        <p class="MsoBodyText" style="margin-top:14px;margin-right:37.8pt;margin-bottom:12px;margin-left:16.9pt;text-align:justify;line-height:115%;">
        <span lang="ES">Con el objetivo de quedar a paz y salvo en todo concepto de entrega de elementos y mantener un adecuado control de los activos, herramientas e implementos que son propiedad de POSITIVO S+ IT SOLUTIONS S.AS y Nuestro cliente IBM, que fueron entregados para la gestión de mi labor, se entregan los siguientes elementos:</span>
        </p>
    ` : '';

    // Declaración inicial exclusiva de Asignación antes de las responsabilidades comunes
    const htmlDeclaracionAsignacion = esAsignacion ? `
        <p class="MsoBodyText" style="margin-top:14px;margin-right:37.8pt;margin-bottom:12px;margin-left:16.9pt;text-align:justify;line-height:115%;">
        <span lang="ES">Como empleado de POSITIVO S+ IT SOLUTIONS S.AS., declaro que los activos relacionados en el presente documento están bajo mi responsabilidad y como tal les daré un uso adecuado, responsable y aceptable para el desempeño eficiente de mis funciones. El uso que daré a estas herramientas se encuentra de acuerdo con la destinación prevista para cada uno de ellos, según los fines establecidos por la empresa.</span></p>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="ES">
<head>
<meta charset="UTF-8">
<style>
    body {
        font-family: 'Calibri', sans-serif;
        color: #000000;
        font-size: 11pt;
        line-height: 1.15;
        margin: 0;
        padding: 0;
    }
    p, .MsoBodyText, .MsoNormal {
        margin-top: 4px;
        margin-bottom: 8px;
    }
    table.master-table {
        width: 100%;
        border-collapse: collapse;
        border: none;
    }
    table.master-table thead {
        display: table-header-group;
    }
    table.master-table tr {
        page-break-inside: auto;
    }
    .header-table {
        width: 100%;
        border-collapse: collapse;
        border: 2px solid black;
        table-layout: fixed;
        margin-bottom: 16px;
    }
    .header-table td {
        border: 2px solid black;
        padding: 6px;
        vertical-align: middle;
        text-align: center;
    }
    .logo-cell {
        width: 38%;
        text-align: center;
        padding: 2px 4px;
        vertical-align: middle;
    }
    .brand-logo {
        max-width: 100%;
        height: auto;
        max-height: 60px;
        display: block;
        margin: 0 auto;
        object-fit: contain;
    }
    .meta-cell {
        font-family: 'Times New Roman', serif;
        font-size: 9.5pt;
        text-align: center;
    }
    .title-cell {
        font-family: 'Times New Roman', serif;
        font-size: 11.5pt;
        font-weight: bold;
        padding: 8px;
        text-align: center;
    }
    table.TableNormal {
        border-collapse: collapse;
        margin-top: 14px;
        margin-bottom: 16px;
        page-break-inside: avoid;
        break-inside: avoid;
    }
</style>
</head>
<body lang="ES-CO" style="tab-interval:.5in;word-wrap:break-word">

<table class="master-table">
    <thead>
        <tr>
            <td>
                <table class="header-table">
                    <tr>
                        <td rowspan="2" class="logo-cell">
                            <img src="${logoSrc}" alt="POSITIVO S+ IT SOLUTIONS" class="brand-logo">
                        </td>
                        <td class="meta-cell">A-ACT-00429</td>
                        <td class="meta-cell">Versión: 2.0</td>
                        <td class="meta-cell">Fecha: ${data.fechaProceso || '&nbsp;'}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="title-cell">
                            ACTA HERRAMIENTAS DE TRABAJO PARA ASOCIADOS
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <p class="MsoBodyText" style="margin-left:19.7pt; margin-bottom:14px; text-align:justify;"><span lang="ES">Positivos<span style="letter-spacing:-.35pt"> </span><span style="letter-spacing:-.5pt">+</span></span></p>
                <p class="MsoNormal" style="margin-left:16.9pt; margin-top:8px; margin-bottom:14px; text-align:justify;"><span lang="ES" style="font-size:12.0pt;">ASUNTO: <b style="mso-bidi-font-weight:normal"><span style="letter-spacing:-.1pt">${asuntoTexto}</span></b></span></p>

                ${htmlIntroduccionAsignacion}

                <!-- TABLA 1: DATOS COLABORADOR -->
                <table class="TableNormal" border="1" cellspacing="0" cellpadding="0" style="margin-left:28.25pt; border:none; mso-border-alt:solid black 2.0pt; mso-border-insideh:2.0pt solid black; mso-border-insidev:2.0pt solid black">
                 <tbody>
                 <tr style="height:15.05pt">
                  <td width="163" valign="top" style="width:122.3pt;border:solid black 2.0pt;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">NOMBRES COMPLETOS</span></p>
                  </td>
                  <td width="451" valign="top" style="width:338.1pt;border:solid black 2.0pt;border-left:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES" style="font-size:10.0pt;">${data.nombresCompletos || '&nbsp;'}</span></p>
                  </td>
                 </tr>
                 <tr style="height:15.3pt">
                  <td width="163" valign="top" style="width:122.3pt;border:solid black 2.0pt;border-top:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">IDENTIFICACIÓN</span></p>
                  </td>
                  <td width="451" valign="top" style="width:338.1pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES" style="font-size:10.0pt;">${data.identificacion || '&nbsp;'}</span></p>
                  </td>
                 </tr>
                 <tr style="height:20.35pt">
                  <td width="163" valign="top" style="width:122.3pt;border:solid black 2.0pt;border-top:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">CORREO CORPORATIVO</span></p>
                  </td>
                  <td width="451" valign="top" style="width:338.1pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">${data.correoCorporativo || '&nbsp;'}</span></p>
                  </td>
                 </tr>
                 <tr style="height:14.95pt">
                  <td width="163" valign="top" style="width:122.3pt;border:solid black 2.0pt;border-top:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">CARGO</span></p>
                  </td>
                  <td width="451" valign="top" style="width:338.1pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">${data.cargo || '&nbsp;'}</span></p>
                  </td>
                 </tr>
                 <tr style="height:14.95pt">
                  <td width="163" valign="top" style="width:122.3pt;border:solid black 2.0pt;border-top:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">CENTRO DE RESULTADOS</span></p>
                  </td>
                  <td width="451" valign="top" style="width:338.1pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES" style="font-size:9.0pt;">${data.centroResultados || '&nbsp;'}</span></p>
                  </td>
                 </tr>
                 <tr style="height:15.05pt">
                  <td width="163" valign="top" style="width:122.3pt;border:solid black 2.0pt;border-top:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">LIDER INMEDIATO</span></p>
                  </td>
                  <td width="451" valign="top" style="width:338.1pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">${data.liderInmediato || '&nbsp;'}</span></p>
                  </td>
                 </tr>
                 <tr style="height:14.95pt">
                  <td width="163" valign="top" style="width:122.3pt;border:solid black 2.0pt;border-top:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">FECHA DEL PROCESO</span></p>
                  </td>
                  <td width="451" valign="top" style="width:338.1pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:3px 6px;">
                  <p class="TableParagraph"><span lang="ES">${data.fechaProceso || '&nbsp;'}</span></p>
                  </td>
                 </tr>
                </tbody></table>

                ${htmlIntroduccionDevolucion}

                <!-- TABLA 2: IMPLEMENTOS DINÁMICOS -->
                <table class="TableNormal" border="1" cellspacing="0" cellpadding="0" style="margin-left:41.65pt; border:none; mso-border-alt:solid black 2.0pt; mso-border-insideh:2.0pt solid black; mso-border-insidev:2.0pt solid black">
                 <tbody>
                 <tr style="height:12.65pt">
                  <td width="620" colspan="4" valign="top" style="width:464.8pt;border:solid black 2.0pt;padding:4px;">
                  <p class="TableParagraph" align="center" style="text-align:center;"><b style="mso-bidi-font-weight:normal"><span lang="ES" style="font-size:10.0pt;font-family:'Trebuchet MS',sans-serif;">IMPLEMENTOS</span></b></p>
                  </td>
                 </tr>
                 <tr style="height:14.95pt">
                  <td width="178" valign="top" style="width:133.6pt;border:solid black 2.0pt;border-top:none;padding:4px;">
                  <p class="TableParagraph" align="center" style="text-align:center;"><b style="mso-bidi-font-weight:normal"><span lang="ES">ELEMENTO</span></b></p>
                  </td>
                  <td width="128" valign="top" style="width:96.15pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:4px;">
                  <p class="TableParagraph" align="center" style="text-align:center;"><b style="mso-bidi-font-weight:normal"><span lang="ES">SERIAL</span></b></p>
                  </td>
                  <td width="67" valign="top" style="width:50.3pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:4px;">
                  <p class="TableParagraph" align="center" style="text-align:center;"><b style="mso-bidi-font-weight:normal"><span lang="ES">ESTADO</span></b></p>
                  </td>
                  <td width="246" valign="top" style="width:184.75pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:4px;">
                  <p class="TableParagraph" align="center" style="text-align:center;"><b style="mso-bidi-font-weight:normal"><span lang="ES">OBSERVACIONES</span></b></p>
                  </td>
                 </tr>
                 
                 ${filasEquiposHtml}

                 <tr style="height:24.8pt">
                  <td width="178" valign="top" style="width:133.6pt;border:solid black 2.0pt;border-top:none;padding:4px;">
                  <p class="TableParagraph" align="center" style="text-align:center;"><b style="mso-bidi-font-weight:normal"><span lang="ES">NOVEDADES</span></b></p>
                  </td>
                  <td width="442" colspan="3" valign="top" style="width:4.6in;border:solid black 2.0pt;border-top:none;border-left:none;padding:4px;">
                  <p class="TableParagraph" align="center" style="text-align:center;"><b style="color: red;"><span lang="ES" style="font-size:10.0pt;font-family:'Trebuchet MS',sans-serif;">${data.novedades}</span></b></p>
                  </td>
                 </tr>
                </tbody></table>

                ${htmlDeclaracionAsignacion}

                <p class="MsoBodyText" style="margin-top:14px;margin-right:37.8pt;margin-bottom:12px;margin-left:16.9pt;text-align:justify;line-height:115%;">
                <span lang="ES">En consecuencia, serán asumidos por mí, cualquier daño o pérdida que les llegaré a causar a los mismos, debido a mi negligencia en el uso de dichos activos o por el incumplimiento de los instructivos relacionados con su uso y conservación. Así mismo, reconozco y acepto que el mal uso de las herramientas de trabajo que me son entregadas eventualmente podrá constituir una falta grave que podría dar lugar a la terminación del contrato de trabajo con justa causa.</span></p>

                <p class="MsoBodyText" style="margin-top:14px;margin-right:37.8pt;margin-bottom:12px;margin-left:16.9pt;text-align:justify;line-height:115%;">
                <span lang="ES">Me comprometo a informar oportunamente a la Gerencia, al Departamento de Sistemas o al área encargada, sobre cualquier daño, avería, pérdida o robo de los activos relacionados y sobre cualquier situación que ponga en riesgo los bienes relacionados.</span></p>

                <p class="MsoBodyText" style="margin-top:14px;margin-right:37.8pt;margin-bottom:12px;margin-left:16.9pt;text-align:justify;line-height:115%;">
                <span lang="ES">En caso de que llegare a producirse mi desvinculación laboral de la empresa con la que actualmente tengo un contrato individual de trabajo, AUTORIZO expresamente a la sociedad comercial POSITIVO S+ IT SOLUTIONS S.AS., identificada con NIT 900.675.394-8, para que deduzca de mi salario, bonificaciones, prestaciones sociales, liquidaciones o de cualquier dinero que se genere a mi favor derivado de la relación laboral que culmina, el valor pendiente por pagar o el valor total si no fueron devueltas las herramientas aquí descritas al momento de finalizar la relación laboral; de no sanear completamente la obligación autorizo para que el dinero en mención sea abonado a la obligación crediticia pendiente; lo anterior de conformidad con los Artículos 149 y 150 del Código Sustantivo de Trabajo.</span></p>

                <p class="MsoBodyText" style="margin-top:8px;margin-right:24.75pt;margin-bottom:10px;margin-left:16.9pt;text-align:justify;line-height:115%;">
                <span lang="ES">Así mismo, AUTORIZO AL FONDO DE CESANTÍAS para que retenga a favor de la sociedad comercial POSITIVO S+ IT SOLUTIONS S.AS., identificada con NIT 900.675.394-8, la suma pendiente de pago; lo anterior solo es exigible en el evento en que con la retención efectuada por la empresa no se alcance a cubrir la totalidad de la obligación; esto de conformidad con el Artículo 29 del Decreto 1063 de 1991.</span></p>

                <p class="MsoBodyText" style="margin-top:8px;margin-right:24.75pt;margin-bottom:10px;margin-left:16.9pt;text-align:justify;line-height:115%;">
                <span lang="ES">El presente acuerdo no vulnerará el DERECHO AL MÍNIMO VITAL, el cual se encuentra estipulado en la legislación COLOMBIANA con el equivalente a un (01) S.M.L.M.V.</span></p>

                <!-- TABLA 3: FIRMAS -->
                <table class="TableNormal" border="1" cellspacing="0" cellpadding="0" style="margin-left:16.95pt; border:none; mso-border-alt:solid black 2.0pt; mso-border-insideh:2.0pt solid black; mso-border-insidev:2.0pt solid black">
                 <tbody>
                 <tr style="height:14.85pt">
                  <td width="103" valign="top" style="width:77.3pt;border:solid black 2.0pt;padding:4px;"></td>
                  <td width="213" valign="top" style="width:159.9pt;border:solid black 2.0pt;border-left:none;padding:4px;">
                  <p class="TableParagraph" style="margin-left:10px;"><span lang="ES" style="font-size:11.0pt;">Nombres Completos</span></p>
                  </td>
                  <td width="109" valign="top" style="width:82.0pt;border:solid black 2.0pt;border-left:none;padding:4px;">
                  <p class="TableParagraph" style="margin-left:10px;"><span lang="ES" style="font-size:11.0pt;">Cédula</span></p>
                  </td>
                  <td width="194" valign="top" style="width:145.25pt;border:solid black 2.0pt;border-left:none;padding:4px;">
                  <p class="TableParagraph" align="center" style="text-align:center;"><span lang="ES" style="font-size:11.0pt;">Firma</span></p>
                  </td>
                 </tr>
                 <tr style="height:60.15pt">
                  <td width="103" valign="top" style="width:77.3pt;border:solid black 2.0pt;border-top:none;padding:6px;">
                  <p class="TableParagraph" style="margin-top:15px;"><span lang="ES">Recibe</span></p>
                  </td>
                  <td width="213" valign="top" style="width:159.9pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:6px;">
                  <p class="TableParagraph" style="margin-top:15px;"><span lang="ES">${data.responsableEntrega || '&nbsp;'}</span></p>
                  </td>
                  <td width="109" valign="top" style="width:82.0pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:6px;">
                  <p class="TableParagraph" style="margin-top:15px;"><span lang="ES">${data.identificacionResponsable || '&nbsp;'}</span></p>
                  </td>
                  <td width="194" valign="top" style="width:145.25pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:6px;"></td>
                 </tr>
                 <tr style="height:60.15pt">
                  <td width="103" valign="top" style="width:77.3pt;border:solid black 2.0pt;border-top:none;padding:6px;">
                  <p class="TableParagraph" style="margin-top:15px;"><span lang="ES">Colaborador</span></p>
                  </td>
                  <td width="213" valign="top" style="width:159.9pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:6px;">
                  <p class="TableParagraph" style="margin-top:15px;"><span lang="ES">${data.nombresCompletos || '&nbsp;'}</span></p>
                  </td>
                  <td width="109" valign="top" style="width:82.0pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:6px;">
                  <p class="TableParagraph" style="margin-top:15px;"><span lang="ES">${data.identificacion || '&nbsp;'}</span></p>
                  </td>
                  <td width="194" valign="top" style="width:145.25pt;border:solid black 2.0pt;border-top:none;border-left:none;padding:6px;"></td>
                 </tr>
                </tbody></table>

            </td>
        </tr>
    </tbody>
</table>

</body>
</html>
    `;
}

/**
 * Función centralizada encargada de levantar Puppeteer y generar el PDF
 */
async function compilarYGenerarPDF(htmlContent, tipoActa, inputData) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: ['load', 'domcontentloaded'] });

    const fileName = generarNombreArchivo(tipoActa, inputData);
    const filePath = path.join(__dirname, '..', 'uploads', fileName);

    const uploadDir = path.dirname(filePath);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
    });

    await browser.close();

    return {
        nombreArchivo: fileName,
        rutaArchivo: filePath
    };
}

/**
 * Función principal enrutadora y optimizada
 */
async function generarActaPDF(inputData = {}) {
    const tipoRaw = inputData.tipoActa || inputData.tipo || 'devolucion';
    
    const tipoActa = String(tipoRaw)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const data = {
        nombresCompletos: inputData.nombresColaborador || inputData.nombresCompletos || inputData.nombre || inputData.nombreCompleto || inputData.colaborador || '',
        identificacion: inputData.identificacion || inputData.cedula || inputData.documento || '',
        correoCorporativo: inputData.correoCorporativo || inputData.correo || inputData.email || '',
        cargo: inputData.cargo || '',
        centroResultados: inputData.centroResultados || inputData.centro || '',
        liderInmediato: inputData.liderInmediato || inputData.lider || '',
        fechaProceso: inputData.fechaDevolucion || inputData.fecha || inputData.fechaAsignacion || '',
        equipos: Array.isArray(inputData.equipos) ? inputData.equipos : (inputData.equipo ? [inputData.equipo] : []),
        novedades: inputData.novedades || 'Ninguna',
        responsableEntrega: inputData.responsableEntrega || inputData.responsable || inputData.quienEntrega || inputData.nombreResponsable || '',
        identificacionResponsable: inputData.identificacionResponsable || inputData.cedulaResponsable || inputData.documentoResponsable || ''
    };

    const filasEquiposHtml = generarFilasEquipos(data.equipos);
    const logoSrc = obtenerLogoBase64();
    const htmlContent = construirHtmlActa(tipoActa, data, logoSrc, filasEquiposHtml);

    return await compilarYGenerarPDF(htmlContent, tipoActa, inputData);
}

module.exports = generarActaPDF;