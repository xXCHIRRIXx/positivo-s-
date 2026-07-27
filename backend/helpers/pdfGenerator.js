const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generarActaPDF(data = {}) {
    // 1. Estructura el HTML completo usando los datos recibidos
    const htmlContent = `

<!DOCTYPE html>
<html lang="ES">
<head>
<meta charset="UTF-8">
<style>
    /* Estilos generales opcionales para complementar las clases de Word */
    body {
        font-family: 'Calibri', sans-serif;
    }
    
    /* --- ESTILOS DEL MEMBRETE OFICIAL --- */
    .header-table {
        width: 100%;
        border-collapse: collapse;
        border: 1.5px solid black;
        table-layout: fixed;
        margin-bottom: 15px;
    }
    .header-table td {
        border: 1px solid black;
        padding: 6px;
        vertical-align: middle;
        text-align: center;
    }
    .logo-cell {
        width: 35%;
        text-align: left;
        font-size: 7.5pt;
        font-weight: bold;
    }
    .brand-name {
        font-size: 15pt;
        font-weight: bold;
        letter-spacing: -0.5px;
    }
    .brand-plus {
        color: #00cc66; /* Verde corporativo */
    }
    .meta-cell {
        font-size: 8.5pt;
    }
    .title-cell {
        font-size: 10.5pt;
        font-weight: bold;
        padding: 8px;
        text-align: center;
    }
</style>
</head>
<body lang="ES-CO" style="tab-interval:.5in;word-wrap:break-word">

<div class="WordSection1">

<!-- ========================================== -->
<!-- TABLA DE ENCABEZADO / MEMBRETE             -->
<!-- ========================================== -->
<table class="header-table">
    <tr>
        <!-- Logo y Razón Social -->
        <td rowspan="2" class="logo-cell">
            POSITIVO S+ IT SOLUTIONS S.A.S.<br>
            <span class="brand-name">POSITIVO S<span class="brand-plus">+</span></span>
        </td>
        <!-- Código, Versión, Fecha -->
        <td class="meta-cell">A-ACT-00429</td>
        <td class="meta-cell">Versión: 2.0</td>
        <td class="meta-cell">Fecha: 10/01/2025</td>
    </tr>
    <tr>
        <!-- Título del Acta -->
        <td colspan="3" class="title-cell">
            ACTA HERRAMIENTAS DE TRABAJO PARA ASOCIADOS
        </td>
    </tr>
</table>

<p class="MsoBodyText" style="margin-top:13.05pt;margin-right:0in;margin-bottom:
0in;margin-left:19.7pt;margin-bottom:.0001pt;text-align:justify"><span lang="ES">Positivos<span style="letter-spacing:-.35pt"> </span><span style="letter-spacing:-.5pt">+</span></span></p>

<p class="MsoNormal" style="margin-top:12.6pt;margin-right:0in;margin-bottom:
0in;margin-left:16.9pt;margin-bottom:.0001pt;text-align:justify"><span lang="ES" style="font-size:12.0pt;mso-bidi-font-size:11.0pt">ASUNTO:<span style="letter-spacing:.05pt"> </span><b style="mso-bidi-font-weight:normal"><span style="letter-spacing:-.1pt">Devolución<o:p></o:p></span></b></span></p>

<p class="MsoNormal" style="margin-top:12.6pt;margin-right:0in;margin-bottom:
0in;margin-left:16.9pt;margin-bottom:.0001pt;text-align:justify"><b style="mso-bidi-font-weight:normal"><span lang="ES" style="font-size:12.0pt;
mso-bidi-font-size:11.0pt"><o:p>&nbsp;</o:p></span></b></p>

<table class="TableNormal" border="1" cellspacing="0" cellpadding="0" style="margin-left:
 28.25pt;border-collapse:collapse;mso-table-layout-alt:fixed;border:none;
 mso-border-alt:solid black 1.0pt;mso-yfti-tbllook:480;mso-padding-alt:0in 0in 0in 0in;
 mso-border-insideh:1.0pt solid black;mso-border-insidev:1.0pt solid black">
 <tbody><tr style="mso-yfti-irow:0;mso-yfti-firstrow:yes;height:15.05pt">
  <td width="163" valign="top" style="width:122.3pt;border:solid black 1.0pt;
  padding:0in 0in 0in 0in;height:15.05pt">
  <p class="TableParagraph" style="margin-top:1.0pt;margin-right:0in;margin-bottom:
  0in;margin-left:.8pt;margin-bottom:.0001pt;line-height:13.05pt;mso-line-height-rule:
  exactly"><span lang="ES">NOMBRES<span style="letter-spacing:-.55pt"> </span><span style="letter-spacing:-.1pt">COMPLETOS</span></span></p>
  </td>
  <td width="451" valign="top" style="width:338.1pt;border-top:solid black 1.0pt;
  border-left:none;border-bottom:solid black 1.0pt;border-right:solid #282828 1.0pt;
  mso-border-left-alt:solid black 1.0pt;padding:0in 0in 0in 0in;height:15.05pt">
  <p class="TableParagraph" style="margin-top:.75pt;margin-right:0in;margin-bottom:
  0in;margin-left:1.05pt;margin-bottom:.0001pt"><span lang="ES" style="font-size:
  10.0pt;mso-bidi-font-size:11.0pt">${data.nombresCompletos || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:1;height:15.3pt">
  <td width="163" valign="top" style="width:122.3pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black 1.0pt;padding:0in 0in 0in 0in;
  height:15.3pt">
  <p class="TableParagraph" style="margin-top:1.25pt;margin-right:0in;margin-bottom:
  0in;margin-left:.8pt;margin-bottom:.0001pt;line-height:13.05pt;mso-line-height-rule:
  exactly"><span lang="ES" style="letter-spacing:-.1pt">IDENTIFICACIÓN</span></p>
  </td>
  <td width="451" valign="top" style="width:338.1pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid #282828 1.0pt;
  mso-border-top-alt:solid black 1.0pt;mso-border-left-alt:solid black 1.0pt;
  padding:0in 0in 0in 0in;height:15.3pt">
  <p class="TableParagraph" style="margin-top:1.0pt;margin-right:0in;margin-bottom:
  0in;margin-left:1.05pt;margin-bottom:.0001pt"><span lang="ES" style="font-size:
  10.0pt;mso-bidi-font-size:11.0pt">${data.identificacion || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:2;height:20.35pt">
  <td width="163" valign="top" style="width:122.3pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black 1.0pt;padding:0in 0in 0in 0in;
  height:20.35pt">
  <p class="TableParagraph" style="margin-top:3.55pt;margin-right:0in;margin-bottom:
  0in;margin-left:.8pt;margin-bottom:.0001pt"><span lang="ES" style="letter-spacing:
  -.1pt">CORREO CORPORATIVO</span></p>
  </td>
  <td width="451" valign="top" style="width:338.1pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid #282828 1.0pt;
  mso-border-top-alt:solid black 1.0pt;mso-border-left-alt:solid black 1.0pt;
  padding:0in 0in 0in 0in;height:20.35pt">
  <p class="TableParagraph" style="margin-top:2.7pt;margin-right:0in;margin-bottom:
  0in;margin-left:1.05pt;margin-bottom:.0001pt"><span lang="ES">${data.correoCorporativo || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:3;height:14.95pt">
  <td width="163" valign="top" style="width:122.3pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black 1.0pt;padding:0in 0in 0in 0in;
  height:14.95pt">
  <p class="TableParagraph" style="margin-top:.9pt;margin-right:0in;margin-bottom:
  0in;margin-left:.8pt;margin-bottom:.0001pt;line-height:13.05pt;mso-line-height-rule:
  exactly"><span lang="ES" style="letter-spacing:-.1pt">CARGO</span></p>
  </td>
  <td width="451" valign="top" style="width:338.1pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid #282828 1.0pt;
  mso-border-top-alt:solid black 1.0pt;mso-border-left-alt:solid black 1.0pt;
  padding:0in 0in 0in 0in;height:14.95pt">
  <p class="TableParagraph" style="margin-top:.3pt;margin-right:0in;margin-bottom:
  0in;margin-left:1.05pt;margin-bottom:.0001pt"><span lang="ES">${data.cargo || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:4;height:14.95pt">
  <td width="163" valign="top" style="width:122.3pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black 1.0pt;padding:0in 0in 0in 0in;
  height:14.95pt">
  <p class="TableParagraph" style="margin-top:.75pt;margin-right:0in;margin-bottom:
  0in;margin-left:.8pt;margin-bottom:.0001pt;line-height:13.15pt;mso-line-height-rule:
  exactly"><span lang="ES">CENTRO<span style="letter-spacing:-.45pt"> </span>DE<span style="letter-spacing:-.15pt"> </span><span style="letter-spacing:-.1pt">RESULTADOS</span></span></p>
  </td>
  <td width="451" valign="top" style="width:338.1pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid #282828 1.0pt;
  mso-border-top-alt:solid black 1.0pt;mso-border-left-alt:solid black 1.0pt;
  padding:0in 0in 0in 0in;height:14.95pt">
  <p class="TableParagraph" style="margin-top:.9pt;margin-right:0in;margin-bottom:
  0in;margin-left:.55pt;margin-bottom:.0001pt"><span lang="ES" style="font-size:
  9.0pt;mso-bidi-font-size:11.0pt;font-family:&quot;Verdana&quot;,sans-serif;mso-hansi-font-family:
  Calibri">${data.centroResultados || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:5;height:15.05pt">
  <td width="163" valign="top" style="width:122.3pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black 1.0pt;padding:0in 0in 0in 0in;
  height:15.05pt">
  <p class="TableParagraph" style="margin-top:1.0pt;margin-right:0in;margin-bottom:
  0in;margin-left:.8pt;margin-bottom:.0001pt;line-height:13.05pt;mso-line-height-rule:
  exactly"><span lang="ES">LIDER<span style="letter-spacing:-.55pt"> </span><span style="letter-spacing:-.1pt">INMEDIATO</span></span></p>
  </td>
  <td width="451" valign="top" style="width:338.1pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid #282828 1.0pt;
  mso-border-top-alt:solid black 1.0pt;mso-border-left-alt:solid black 1.0pt;
  padding:0in 0in 0in 0in;height:15.05pt">
  <p class="TableParagraph" style="margin-left:1.05pt;line-height:13.35pt;
  mso-line-height-rule:exactly"><span lang="ES">${data.liderInmediato || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:6;mso-yfti-lastrow:yes;height:14.95pt">
  <td width="163" valign="top" style="width:122.3pt;border-top:none;border-left:
  solid black 1.0pt;border-bottom:solid #282828 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black 1.0pt;padding:0in 0in 0in 0in;height:14.95pt">
  <p class="TableParagraph" style="margin-top:.9pt;margin-right:0in;margin-bottom:
  0in;margin-left:.8pt;margin-bottom:.0001pt;line-height:13.05pt;mso-line-height-rule:
  exactly"><span lang="ES">FECHA<span style="letter-spacing:-.3pt"> </span>DE<span style="letter-spacing:-.45pt"> </span><span style="letter-spacing:-.1pt">DEVOLUCION</span></span></p>
  </td>
  <td width="451" valign="top" style="width:338.1pt;border-top:none;border-left:
  none;border-bottom:solid #282828 1.0pt;border-right:solid #282828 1.0pt;
  mso-border-top-alt:solid black 1.0pt;mso-border-left-alt:solid black 1.0pt;
  padding:0in 0in 0in 0in;height:14.95pt">
  <p class="TableParagraph" style="margin-top:.8pt;margin-right:0in;margin-bottom:
  0in;margin-left:.55pt;margin-bottom:.0001pt;line-height:13.15pt;mso-line-height-rule:
  exactly"><span lang="ES">${data.fechaDevolucion || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
 </tr>
</tbody></table>

<p class="MsoBodyText" style="margin-top:14.1pt"><b style="mso-bidi-font-weight:
normal"><span lang="ES"><o:p>&nbsp;</o:p></span></b></p>

<p class="MsoBodyText" style="margin-top:0in;margin-right:37.8pt;margin-bottom:
0in;margin-left:16.9pt;margin-bottom:.0001pt;text-align:justify;line-height:
105%"><span lang="ES">Con<span style="letter-spacing:2.0pt"> </span>el objetivo
de quedar<span style="letter-spacing:2.0pt"> </span>a<span style="letter-spacing:
2.0pt"> </span>paz<span style="letter-spacing:2.0pt"> </span>y<span style="letter-spacing:2.0pt"> </span>salvo<span style="letter-spacing:2.0pt"> </span>en<span style="letter-spacing:2.0pt"> </span>todo<span style="letter-spacing:2.0pt"> </span>concepto<span style="letter-spacing:2.0pt"> </span>de<span style="letter-spacing:2.0pt"> </span>entrega<span style="letter-spacing:2.0pt"> </span>de<span style="letter-spacing:2.0pt"> </span>elementos<span style="letter-spacing:2.0pt"> </span>y mantener un adecuado<span style="letter-spacing:-.15pt"> </span>control de los activos, herramientas e
implementos que son propiedad de<span style="letter-spacing:-.35pt"> </span>POSITIVO<span style="letter-spacing:-.35pt"> </span>S+<span style="letter-spacing:-.35pt"> </span>IT<span style="letter-spacing:-.35pt"> </span>SOLUTIONS<span style="letter-spacing:
-.35pt"> </span>S.AS<span style="letter-spacing:-.35pt"> </span>y<span style="letter-spacing:-.4pt"> </span>Nuestro<span style="letter-spacing:-.3pt">
</span>cliente<span style="letter-spacing:-.3pt"> </span>IBM,<span style="letter-spacing:-.45pt"> </span>que<span style="letter-spacing:-.45pt"> </span>fueron<span style="letter-spacing:-.25pt"> </span>entregados<span style="letter-spacing:
-.25pt"> </span>para<span style="letter-spacing:-.45pt"> </span>la<span style="letter-spacing:-.35pt"> </span>gestión de mi labor, se entregan los
siguientes elementos:</span></p>

<table class="TableNormal" border="1" cellspacing="0" cellpadding="0" style="margin-left:
 41.65pt;border-collapse:collapse;mso-table-layout-alt:fixed;border:none;
 mso-border-alt:solid black .75pt;mso-yfti-tbllook:480;mso-padding-alt:0in 0in 0in 0in;
 mso-border-insideh:.75pt solid black;mso-border-insidev:.75pt solid black">
 <tbody><tr style="mso-yfti-irow:0;mso-yfti-firstrow:yes;height:12.65pt">
  <td width="620" colspan="4" valign="top" style="width:464.8pt;border:solid black 1.0pt;
  mso-border-alt:solid black .75pt;padding:0in 0in 0in 0in;height:12.65pt">
  <p class="TableParagraph" align="center" style="margin-left:1.85pt;text-align:
  center;line-height:11.55pt;mso-line-height-rule:exactly"><b style="mso-bidi-font-weight:
  normal"><span lang="ES" style="font-size:10.0pt;mso-bidi-font-size:11.0pt;
  font-family:&quot;Trebuchet MS&quot;,sans-serif;mso-hansi-font-family:Calibri;
  letter-spacing:-.1pt">IMPLEMENTOS</span></b><b style="mso-bidi-font-weight:
  normal"><span lang="ES" style="font-size:10.0pt;mso-bidi-font-size:11.0pt;
  font-family:&quot;Trebuchet MS&quot;,sans-serif;mso-hansi-font-family:Calibri"><o:p></o:p></span></b></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:1;height:14.95pt">
  <td width="178" valign="top" style="width:133.6pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black .75pt;mso-border-alt:solid black .75pt;
  padding:0in 0in 0in 0in;height:14.95pt">
  <p class="TableParagraph" align="center" style="margin-top:.9pt;margin-right:
  0in;margin-bottom:0in;margin-left:2.45pt;margin-bottom:.0001pt;text-align:
  center;line-height:13.05pt;mso-line-height-rule:exactly"><b style="mso-bidi-font-weight:
  normal"><span lang="ES" style="letter-spacing:-.1pt">ELEMENTO</span><span lang="ES"><o:p></o:p></span></b></p>
  </td>
  <td width="128" valign="top" style="width:96.15pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .75pt;mso-border-left-alt:solid black .75pt;
  mso-border-alt:solid black .75pt;padding:0in 0in 0in 0in;height:14.95pt">
  <p class="TableParagraph" align="center" style="margin-top:.9pt;margin-right:
  0in;margin-bottom:0in;margin-left:1.35pt;margin-bottom:.0001pt;text-align:
  center;line-height:13.05pt;mso-line-height-rule:exactly"><b style="mso-bidi-font-weight:
  normal"><span lang="ES" style="letter-spacing:-.1pt">SERIAL</span><span lang="ES"><o:p></o:p></span></b></p>
  </td>
  <td width="67" valign="top" style="width:50.3pt;border-top:none;border-left:none;
  border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;mso-border-top-alt:
  solid black .75pt;mso-border-left-alt:solid black .75pt;mso-border-alt:solid black .75pt;
  padding:0in 0in 0in 0in;height:14.95pt">
  <p class="TableParagraph" align="center" style="margin-top:.9pt;margin-right:
  .7pt;margin-bottom:0in;margin-left:2.45pt;margin-bottom:.0001pt;text-align:
  center;line-height:13.05pt;mso-line-height-rule:exactly"><b style="mso-bidi-font-weight:
  normal"><span lang="ES" style="letter-spacing:-.1pt">ESTADO</span><span lang="ES"><o:p></o:p></span></b></p>
  </td>
  <td width="246" valign="top" style="width:184.75pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .75pt;mso-border-left-alt:solid black .75pt;
  mso-border-alt:solid black .75pt;padding:0in 0in 0in 0in;height:14.95pt">
  <p class="TableParagraph" align="center" style="margin-top:.9pt;margin-right:
  .25pt;margin-bottom:0in;margin-left:.95pt;margin-bottom:.0001pt;text-align:
  center;line-height:13.05pt;mso-line-height-rule:exactly"><b style="mso-bidi-font-weight:
  normal"><span lang="ES" style="letter-spacing:-.1pt">OBSERVACIONES</span><span lang="ES"><o:p></o:p></span></b></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:2;height:21.65pt">
  <td width="178" valign="top" style="width:133.6pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black .75pt;mso-border-alt:solid black .75pt;
  padding:0in 0in 0in 0in;height:21.65pt">
  <p class="TableParagraph" align="center" style="margin-top:1.15pt;margin-right:
  1.0pt;margin-bottom:0in;margin-left:2.45pt;margin-bottom:.0001pt;text-align:
  center"><b style="mso-bidi-font-weight:normal"><span lang="ES">${data.elemento || '<o:p>&nbsp;</o:p>'}</span></b></p>
  </td>
  <td width="128" valign="top" style="width:96.15pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .75pt;mso-border-left-alt:solid black .75pt;
  mso-border-alt:solid black .75pt;padding:0in 0in 0in 0in;height:21.65pt">
  <p class="TableParagraph" align="center" style="margin-top:.3pt;margin-right:
  .2pt;margin-bottom:0in;margin-left:1.35pt;margin-bottom:.0001pt;text-align:
  center"><span lang="ES">${data.serial || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
  <td width="67" valign="top" style="width:50.3pt;border-top:none;border-left:none;
  border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;mso-border-top-alt:
  solid black .75pt;mso-border-left-alt:solid black .75pt;mso-border-alt:solid black .75pt;
  padding:0in 0in 0in 0in;height:21.65pt">
  <p class="TableParagraph" align="center" style="margin-top:1.15pt;margin-right:
  0in;margin-bottom:0in;margin-left:2.45pt;margin-bottom:.0001pt;text-align:
  center"><b style="mso-bidi-font-weight:normal"><span lang="ES">${data.estado || '<o:p>&nbsp;</o:p>'}</span></b></p>
  </td>
  <td width="246" valign="top" style="width:184.75pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .75pt;mso-border-left-alt:solid black .75pt;
  mso-border-alt:solid black .75pt;padding:0in 0in 0in 0in;height:21.65pt">
  <p class="TableParagraph"><span lang="ES" style="font-family:&quot;Times New Roman&quot;,serif;
  mso-hansi-font-family:Calibri;mso-bidi-font-family:Calibri">${data.observaciones || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:3;mso-yfti-lastrow:yes;height:24.8pt">
  <td width="178" valign="top" style="width:133.6pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black .75pt;mso-border-alt:solid black .75pt;
  padding:0in 0in 0in 0in;height:24.8pt">
  <p class="TableParagraph" align="center" style="margin-top:5.6pt;margin-right:
  .65pt;margin-bottom:0in;margin-left:2.45pt;margin-bottom:.0001pt;text-align:
  center"><b style="mso-bidi-font-weight:normal"><span lang="ES" style="letter-spacing:-.1pt">NOVEDADES</span><span lang="ES"><o:p></o:p></span></b></p>
  </td>
  <td width="442" colspan="3" valign="top" style="width:4.6in;border-top:none;
  border-left:none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .75pt;mso-border-left-alt:solid black .75pt;
  mso-border-alt:solid black .75pt;padding:0in 0in 0in 0in;height:24.8pt">
  <p class="TableParagraph" style="line-height:11.55pt;mso-line-height-rule:exactly"><span lang="ES" style="font-size:10.0pt;mso-bidi-font-size:11.0pt;font-family:&quot;Trebuchet MS&quot;,sans-serif;
  mso-hansi-font-family:Calibri">${data.novedades || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
 </tr>
</tbody></table>

<p class="MsoBodyText" style="margin-top:2.0pt"><span lang="ES"><o:p>&nbsp;</o:p></span></p>

<p class="MsoBodyText" style="margin-top:0in;margin-right:37.8pt;margin-bottom:
0in;margin-left:16.9pt;margin-bottom:.0001pt;text-align:justify;line-height:
105%"><span lang="ES">Con<span style="letter-spacing:2.0pt"> </span>el objetivo
de quedar<span style="letter-spacing:2.0pt"> </span>a<span style="letter-spacing:
2.0pt"> </span>paz<span style="letter-spacing:2.0pt"> </span>y<span style="letter-spacing:2.0pt"> </span>salvo<span style="letter-spacing:2.0pt"> </span>en<span style="letter-spacing:2.0pt"> </span>todo<span style="letter-spacing:2.0pt"> </span>concepto<span style="letter-spacing:2.0pt"> </span>de<span style="letter-spacing:2.0pt"> </span>entrega<span style="letter-spacing:2.0pt"> </span>de<span style="letter-spacing:2.0pt"> </span>elementos<span style="letter-spacing:2.0pt"> </span>y mantener un adecuado<span style="letter-spacing:-.15pt"> </span>control de los activos, herramientas e
implementos que son propiedad de<span style="letter-spacing:-.35pt"> </span>POSITIVO<span style="letter-spacing:-.35pt"> </span>S+<span style="letter-spacing:-.35pt"> </span>IT<span style="letter-spacing:-.35pt"> </span>SOLUTIONS<span style="letter-spacing:
-.35pt"> </span>S.AS<span style="letter-spacing:-.35pt"> </span>y<span style="letter-spacing:-.4pt"> </span>Nuestro<span style="letter-spacing:-.3pt">
</span>cliente<span style="letter-spacing:-.3pt"> </span>IBM,<span style="letter-spacing:-.45pt"> </span>que<span style="letter-spacing:-.45pt"> </span>fueron<span style="letter-spacing:-.25pt"> </span>entregados<span style="letter-spacing:
-.25pt"> </span>para<span style="letter-spacing:-.45pt"> </span>la<span style="letter-spacing:-.35pt"> </span>gestión de mi labor, se entregan los
siguientes elementos:</span></p>

<p class="MsoBodyText"><span lang="ES"><o:p>&nbsp;</o:p></span></p>

<p class="MsoBodyText" style="margin-top:0in;margin-right:24.9pt;margin-bottom:
0in;margin-left:16.9pt;margin-bottom:.0001pt;text-align:justify;line-height:
105%"><span lang="ES">En consecuencia, serán asumidos por mí, cualquier daño o
pérdida que les llegaré a causar a los mismos, debido a mi negligencia en el
uso de dichos activos o por el incumplimiento de los instructivos<span style="letter-spacing:-.15pt"> </span>relacionados<span style="letter-spacing:
-.1pt"> </span>con<span style="letter-spacing:-.1pt"> </span>su<span style="letter-spacing:-.25pt"> </span>uso<span style="letter-spacing:-.15pt"> </span>y<span style="letter-spacing:-.45pt"> </span>conservación.<span style="letter-spacing:
-.15pt"> </span>Así<span style="letter-spacing:-.1pt"> </span>mismo,<span style="letter-spacing:-.05pt"> </span>reconozco<span style="letter-spacing:
-.25pt"> </span>y<span style="letter-spacing:-.1pt"> </span>acepto<span style="letter-spacing:-.1pt"> </span>que<span style="letter-spacing:-.05pt"> </span>el<span style="letter-spacing:-.2pt"> </span>mal<span style="letter-spacing:-.2pt"> </span>uso
de las herramientas de trabajo que me son entregadas eventualmente podrá
constituir una falta grave que podría dar lugar a la terminación del contrato
de trabajo con justa causa.</span></p>

<p class="MsoBodyText"><span lang="ES"><o:p>&nbsp;</o:p></span></p>

<p class="MsoBodyText" style="margin-top:0in;margin-right:25.3pt;margin-bottom:
0in;margin-left:16.9pt;margin-bottom:.0001pt;text-align:justify;line-height:
105%"><span lang="ES">Me comprometo a informar oportunamente a la Gerencia, al
Departamento de Sistemas<span style="letter-spacing:-.05pt"> </span>o al área
encargada, sobre cualquier daño, avería, pérdida o robo de los activos
relacionados y sobre cualquier situación que ponga en riesgo los bienes
relacionados.</span></p>

<p class="MsoBodyText"><span lang="ES"><o:p>&nbsp;</o:p></span></p>

<p class="MsoBodyText" style="margin-left:16.9pt;text-align:justify"><span lang="ES">En<span style="letter-spacing:3.55pt"> </span>caso<span style="letter-spacing:3.35pt"> </span>de<span style="letter-spacing:3.55pt"> </span>que<span style="letter-spacing:3.5pt"> </span>llegare<span style="letter-spacing:3.75pt">
</span>a<span style="letter-spacing:3.5pt"> </span>producirse<span style="letter-spacing:3.65pt"> </span>mi<span style="letter-spacing:3.5pt"> </span>desvinculación<span style="letter-spacing:3.75pt"> </span>laboral<span style="letter-spacing:3.5pt">
</span>de<span style="letter-spacing:3.4pt"> </span>la<span style="letter-spacing:
3.6pt"> </span>empresa<span style="letter-spacing:3.6pt"> </span>con<span style="letter-spacing:3.55pt"> </span>la<span style="letter-spacing:3.55pt"> </span><span style="letter-spacing:-.25pt">que</span></span></p>

</div>

<span lang="ES" style="font-size:12.0pt;font-family:&quot;Calibri&quot;,sans-serif;
mso-fareast-font-family:Calibri;mso-ansi-language:ES;mso-fareast-language:EN-US;
mso-bidi-language:AR-SA"><br clear="all" style="page-break-before:always;
mso-break-type:section-break">
</span>

<div class="WordSection2">

<p class="MsoBodyText" style="margin-top:13.05pt;margin-right:24.95pt;margin-bottom:
0in;margin-left:16.9pt;margin-bottom:.0001pt;text-align:justify;line-height:
105%"><span lang="ES">actualmente tengo un contrato individual de trabajo,
AUTORIZO expresamente a la sociedad comercial POSITIVO S+ IT SOLUTIONS S.AS,
identificada con NIT 900.675.394-8, para que deduzca de mi salario,
bonificaciones, prestaciones sociales, liquidaciones o de cualquier dinero que
se genere a mi favor derivado de la relación laboral que culmina, el valor
pendiente por pagar o el valor<span style="letter-spacing:-.6pt"> </span>total<span style="letter-spacing:-.65pt"> </span>si<span style="letter-spacing:-.7pt"> </span>no<span style="letter-spacing:-.65pt"> </span>fueron<span style="letter-spacing:-.6pt">
</span>devueltos<span style="letter-spacing:-.5pt"> </span>las<span style="letter-spacing:-.65pt"> </span>herramientas<span style="letter-spacing:
-.55pt"> </span>aquí<span style="letter-spacing:-.6pt"> </span>descritas<span style="letter-spacing:-.65pt"> </span>al<span style="letter-spacing:-.55pt"> </span>momento<span style="letter-spacing:-.6pt"> </span>de<span style="letter-spacing:-.65pt"> </span>finalizar<span style="letter-spacing:-.5pt"> </span>la<span style="letter-spacing:-.55pt"> </span>relación
laboral; de no sanear completamente la obligación autorizo para que el dinero
en mención sea abonado a la obligación crediticia pendiente; lo anterior de
conformidad con los</span></p>

<p class="MsoBodyText" style="margin-left:16.9pt;text-align:justify;line-height:
14.55pt;mso-line-height-rule:exactly"><span lang="ES">Artículos 149<span style="letter-spacing:.05pt"> </span>y 150 del<span style="letter-spacing:-.05pt">
</span>Código Sustantivo<span style="letter-spacing:-.05pt"> </span>de <span style="letter-spacing:-.1pt">Trabajo.</span></span></p>

<p class="MsoBodyText" style="margin-top:.7pt"><span lang="ES"><o:p>&nbsp;</o:p></span></p>

<p class="MsoBodyText" style="margin-top:0in;margin-right:24.75pt;margin-bottom:
0in;margin-left:16.9pt;margin-bottom:.0001pt;text-align:justify;line-height:
105%"><span lang="ES">Así<span style="letter-spacing:-.1pt"> </span>mismo,<span style="letter-spacing:-.05pt"> </span>AUTORIZO<span style="letter-spacing:-.1pt">
</span>AL<span style="letter-spacing:-.05pt"> </span>FONDO<span style="letter-spacing:-.1pt"> </span>DE<span style="letter-spacing:-.05pt"> </span>CESANTÍAS<span style="letter-spacing:-.15pt"> </span>for that<span style="letter-spacing:-.05pt">
</span>retenga<span style="letter-spacing:-.05pt"> </span>a<span style="letter-spacing:-.05pt"> </span>favor<span style="letter-spacing:-.15pt">
</span>de<span style="letter-spacing:-.05pt"> </span>la<span style="letter-spacing:
-.05pt"> </span>sociedad comercial POSITIVO S+ IT SOLUTIONS S.AS, identificada
con NIT 900.675.394-8, la suma pendiente de pago; lo anterior solo es exigible
en el evento en que con la retención efectuada por la empresa no se alcance a
cubrir la totalidad de la obligación; esto de conformidad con el Artículo 29
del Decreto 1063 de 1991.</span></p>

<p class="MsoBodyText" style="margin-top:.15pt"><span lang="ES"><o:p>&nbsp;</o:p></span></p>

<p class="MsoBodyText" style="margin-top:0in;margin-right:25.4pt;margin-bottom:
0in;margin-left:16.9pt;margin-bottom:.0001pt;text-align:justify"><span lang="ES">El
presente acuerdo no vulnerará el DERECHO AL MÍNIMO VITAL, el cual se encuentra
estipulado en la legislación COLOMBIANA con el equivalente a un (01) S.M.L.M.V.</span></p>

<p class="MsoBodyText" style="margin-top:2.9pt"><span lang="ES" style="font-size:
10.0pt;mso-bidi-font-size:12.0pt"><o:p>&nbsp;</o:p></span></p>

<table class="TableNormal" border="1" cellspacing="0" cellpadding="0" style="margin-left:
 16.95pt;border-collapse:collapse;mso-table-layout-alt:fixed;border:none;
 mso-border-alt:solid black .5pt;mso-yfti-tbllook:480;mso-padding-alt:0in 0in 0in 0in;
 mso-border-insideh:.5pt solid black;mso-border-insidev:.5pt solid black">
 <tbody><tr style="mso-yfti-irow:0;mso-yfti-firstrow:yes;height:14.85pt">
  <td width="103" valign="top" style="width:77.3pt;border:solid black 1.0pt;
  mso-border-alt:solid black .5pt;padding:0in 0in 0in 0in;height:14.85pt">
  <p class="TableParagraph"><span lang="ES" style="font-family:&quot;Times New Roman&quot;,serif;
  mso-hansi-font-family:Calibri;mso-bidi-font-family:Calibri"><o:p>&nbsp;</o:p></span></p>
  </td>
  <td width="213" valign="top" style="width:159.9pt;border:solid black 1.0pt;
  border-left:none;mso-border-left-alt:solid black .5pt;mso-border-alt:solid black .5pt;
  padding:0in 0in 0in 0in;height:14.85pt">
  <p class="TableParagraph" style="margin-left:28.0pt;line-height:13.85pt;
  mso-line-height-rule:exactly"><span lang="ES" style="font-size:12.0pt;
  mso-bidi-font-size:11.0pt">Nombres<span style="letter-spacing:-.35pt"> </span><span style="letter-spacing:-.1pt">Completos</span><o:p></o:p></span></p>
  </td>
  <td width="109" valign="top" style="width:82.0pt;border:solid black 1.0pt;
  border-left:none;mso-border-left-alt:solid black .5pt;mso-border-alt:solid black .5pt;
  padding:0in 0in 0in 0in;height:14.85pt">
  <p class="TableParagraph" style="margin-left:24.4pt;line-height:13.85pt;
  mso-line-height-rule:exactly"><span lang="ES" style="font-size:12.0pt;
  mso-bidi-font-size:11.0pt;letter-spacing:-.1pt">Cédula</span><span lang="ES" style="font-size:12.0pt;mso-bidi-font-size:11.0pt"><o:p></o:p></span></p>
  </td>
  <td width="194" valign="top" style="width:145.25pt;border:solid black 1.0pt;
  border-left:none;mso-border-left-alt:solid black .5pt;mso-border-alt:solid black .5pt;
  padding:0in 0in 0in 0in;height:14.85pt">
  <p class="TableParagraph" align="center" style="margin-left:14.95pt;text-align:
  center;line-height:13.85pt;mso-line-height-rule:exactly"><span lang="ES" style="font-size:12.0pt;mso-bidi-font-size:11.0pt;letter-spacing:-.1pt">Firma</span><span lang="ES" style="font-size:12.0pt;mso-bidi-font-size:11.0pt"><o:p></o:p></span></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:1;height:70.15pt">
  <td width="103" valign="top" style="width:77.3pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black .5pt;mso-border-alt:solid black .5pt;
  padding:0in 0in 0in 0in;height:70.15pt">
  <p class="TableParagraph"><span lang="ES"><o:p>&nbsp;</o:p></span></p>
  <p class="TableParagraph" style="margin-top:5.85pt"><span lang="ES"><o:p>&nbsp;</o:p></span></p>
  <p class="TableParagraph" style="margin-left:.7pt"><span lang="ES" style="letter-spacing:-.1pt">Entrega</span></p>
  </td>
  <td width="213" valign="top" style="width:159.9pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .5pt;mso-border-left-alt:solid black .5pt;
  mso-border-alt:solid black .5pt;padding:0in 0in 0in 0in;height:70.15pt">
  <p class="TableParagraph"><span lang="ES"><o:p>&nbsp;</o:p></span></p>
  <p class="TableParagraph" style="margin-top:4.9pt"><span lang="ES">${data.nombresCompletos || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
  <td width="109" valign="top" style="width:82.0pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .5pt;mso-border-left-alt:solid black .5pt;
  mso-border-alt:solid black .5pt;padding:0in 0in 0in 0in;height:70.15pt">
  <p class="TableParagraph"><span lang="ES"><o:p>&nbsp;</o:p></span></p>
  <p class="TableParagraph" style="margin-top:5.05pt"><span lang="ES">${data.identificacion || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
  <td width="194" valign="top" style="width:145.25pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .5pt;mso-border-left-alt:solid black .5pt;
  mso-border-alt:solid black .5pt;padding:0in 0in 0in 0in;height:70.15pt">
  <p class="TableParagraph" style="margin-left:4.05pt"><span lang="ES" style="font-size:10.0pt;mso-bidi-font-size:11.0pt"><o:p>&nbsp;</o:p></span></p>
  </td>
 </tr>
 <tr style="mso-yfti-irow:2;mso-yfti-lastrow:yes;height:75.1pt">
  <td width="103" valign="top" style="width:77.3pt;border:solid black 1.0pt;
  border-top:none;mso-border-top-alt:solid black .5pt;mso-border-alt:solid black .5pt;
  padding:0in 0in 0in 0in;height:75.1pt">
  <p class="TableParagraph"><span lang="ES"><o:p>&nbsp;</o:p></span></p>
  <p class="TableParagraph"><span lang="ES"><o:p>&nbsp;</o:p></span></p>
  <p class="TableParagraph" style="margin-top:1.65pt"><span lang="ES"><o:p>&nbsp;</o:p></span></p>
  <p class="TableParagraph" style="margin-left:.7pt"><span lang="ES" style="letter-spacing:-.1pt">Colaborador</span></p>
  </td>
  <td width="213" valign="top" style="width:159.9pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .5pt;mso-border-left-alt:solid black .5pt;
  mso-border-alt:solid black .5pt;padding:0in 0in 0in 0in;height:75.1pt">
  <p class="TableParagraph"><span lang="ES" style="font-size:10.0pt;mso-bidi-font-size:
  11.0pt"><o:p>&nbsp;</o:p></span></p>
  <p class="TableParagraph" style="margin-top:8.5pt"><span lang="ES" style="font-size:10.0pt;mso-bidi-font-size:11.0pt">${data.nombresCompletos || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
  <td width="109" valign="top" style="width:82.0pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .5pt;mso-border-left-alt:solid black .5pt;
  mso-border-alt:solid black .5pt;padding:0in 0in 0in 0in;height:75.1pt">
  <p class="TableParagraph"><span lang="ES" style="font-size:10.0pt;mso-bidi-font-size:
  11.0pt"><o:p>&nbsp;</o:p></span></p>
  <p class="TableParagraph" style="margin-top:8.05pt"><span lang="ES" style="font-size:10.0pt;mso-bidi-font-size:11.0pt">${data.identificacion || '<o:p>&nbsp;</o:p>'}</span></p>
  </td>
  <td width="194" valign="top" style="width:145.25pt;border-top:none;border-left:
  none;border-bottom:solid black 1.0pt;border-right:solid black 1.0pt;
  mso-border-top-alt:solid black .5pt;mso-border-left-alt:solid black .5pt;
  mso-border-alt:solid black .5pt;padding:0in 0in 0in 0in;height:75.1pt">
  <p class="TableParagraph" style="margin-left:4.05pt"><span lang="ES" style="font-size:10.0pt;mso-bidi-font-size:11.0pt"><o:p>&nbsp;</o:p></span></p>
  </td>
 </tr>
</tbody></table>

</div>
</body>
</html>
    `;
    // 2. Inicializar Puppeteer para compilar el PDF
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Definir ruta temporal para guardar el PDF generado
    const fileName = `acta_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', fileName);

    // Asegurarse de que la carpeta uploads exista
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

    // Retornar la ruta o nombre del archivo para que el controlador lo descargue
    return {
        nombreArchivo: fileName,
        rutaArchivo: filePath
    };
}

// Exportar la función correctamente para Node.js
module.exports = generarActaPDF;