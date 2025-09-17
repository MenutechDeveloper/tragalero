const contentDiv = document.getElementById('content');
const buttons = document.querySelectorAll('nav button');

const sections = {
  tutorial: `
<div class="printer-setup">
  <h2>Epson TM-T20III (Ethernet) Setup Guide</h2>

  <div class="step">
    <h3>STEP 1: Connect the Printer</h3>
    <ul>
      <li>Plug in the power cable and turn on the printer.</li>
      <li>Connect the Ethernet cable from the printer to your router or switch.</li>
    </ul>
    <img src="./assets/img/mceclip1.png" alt="Printer connection">
  </div>

  <div class="step">
    <h3>STEP 2: Print Network Status</h3>
    <ul>
      <li>Turn off the printer.</li>
      <li>Hold the <strong>Feed</strong> button and turn the printer back on.</li>
      <li>Release the button when it starts printing.</li>
      <li>Check the printed sheet for the IP address (e.g. <code>192.168.1.100</code>).</li>
    </ul>
    <img src="./assets/img/paso2.jpg" alt="Print network status">
  </div>

  <div class="step">
    <h3>Paso 3: Conexión</h3>
    <p>Selecciona tu plataforma para ver los pasos específicos:</p>
    <div class="subnav">
      <button data-platform="windows" class="active">Windows</button>
      <button data-platform="android">Android</button>
      <button data-platform="ios">iOS</button>
    </div>
    <div id="step3-content"></div>
  </div>


  <div class="step">
    <h3>STEP 4: Connect Your Epson TM-T20III Printer with Menutech</h3>
    <ul>
      <li>Ensure your Epson TM-T20III printer is configured as a network printer and accessible via its IP address on your local network.</li>
      <li>To print orders from Menutech, use compatible printing solutions such as <strong>ePOS-Print</strong>, <strong>Raw printing</strong>, <strong>PrintNode</strong>, or <strong>QZ Tray</strong>. These tools allow Menutech to send print jobs directly to your Epson printer seamlessly.</li>
    </ul>
    <img src="./assets/img/paso7.jpg" alt="Menutech POS integration">
  </div>
</div>
  `,
    about: `
<div class="printing" id="PrintingOrdersWithTheOrderTakingApp">
  <h2>Printing orders with the Order Taking App</h2>
  <p>Our order taking app can be connected to multiple Epson and Star thermal printers.<br><br>

Thermal printers are widely used in restaurants. They are robust, fast, require no toner change and paper costs are close to nothing. Epson and Star are leading manufacturers in this segment.<br><br>

The app supports three types of printer connection:<br><br>

  <strong>LAN (Ethernet)</strong> - the thermal printer is connected by network cable to a WiFi router and accesses the same WiFi network as the order taking device does;<br><br>
  <strong>WLAN (WiFi)</strong> - the thermal printer connects wirelessly to the same WiFi network that’s used by the order taking device;<br><br>
  <strong>Bluetooth</strong> - the thermal printer connects directly to the order taking device via Bluetooth.<br><br>
  <strong>To add a printer</strong>, open the order taking app and select Thermal printer from the menu. The app will guide you through adding a LAN, WiFi or Bluetooth printer.<br><br></p>
  <ul>
    <li>When adding a LAN / WiFi printer, double check that the printer and your order taking device are connected to the same network.</li>
    <li>When adding a Bluetooth printer, first pair the printer with the device and then add the printer in the app.</li>
  </ul>
  <p>
    In case you have multiple working stations, you can add several printers and have your orders printed on all of them. The iOS version of the Order Taking App supports adding multiple printers with different connectivity types (like shown in the image below). On Android, all your printers must have the same connectivity type (all LAN/WiFI or all Bluetooth).
  </p><br>
  <img src="./assets/img/i2.webp"/>
  <p>Furthermore, you can go in the Admin Panel and decide exactly what to be printed on each printer: which template, number of copies and language. For text-only printers you will be limited to the text-only receipt template. But for printers that support image printing, you can create custom restaurant receipts and assign them as needed per printers.</p><br>
  <img src="./assets/img/i3.webp"/><br><br>
  <p>To benefit from Custom Printing, you need:</p>
  <ul>
    <li>Restaurant Order Taking App version: 1.2.21 for Android, 1.1.40 for iPhone/iPad - or higher.</li>
    <li>Software version of your phone or tablet: 4.4 or higher for Android, 9.0 or higher for iOS;</li>
    <li>A compatible thermal printer that supports image printing.</li>
  </ul>
</div>

<div class="restaurant" id="RestaurantReceiptTemplates">
  <h1>Restaurant receipt templates</h1>
  <p>In the Admin you can find 2 restaurant receipt templates that we’ve prepared for you, suggestively called Client receipt and Kitchen essentials.</p>
  <div class="columnas">
    <div class="row">
      <div class="col org">
        <p>The <strong>Client receipt</strong> template contains:</p>
        <ul>
          <li>The payment method chosen by the customer (cash, credit card etc);</li>
          <li>Time to deliver/pick-up the order;</li>
          <li>Estimated drive time and directions (for delivery orders);</li>
          <li>Client’s contact info;</li>
          <li>The order details (including items, prices, taxes and total);</li>
          <li>Confirmation box for client’s signature at handout.</li>
        </ul>
      </div>
      <div class="col"><div class="scrollimage"><img src="./assets/img/i4.webp"></div></div>
    </div>
  </div>
  <div class="columnas2">
    <div class="row">
      <div class="col org">
        <p>The <strong>Kitchen essentials</strong> template contains:</p>
        <ul>
          <li>Order type (delivery, pickup or order ahead for dine-in);</li>
          <li>Client’s name and comments;</li>
          <li>Full order details (the items ordered with their according customizations, quantities and comments);</li>
          <li>Quality control box for the final check at the packing station.</li>
        </ul>
      </div>
      <div class="col"><div class="scrollimage"><img src="./assets/img/i5.webp"/></div></div>
    </div>
  </div>
  <p><strong>Note:</strong> You need a printer with image printing capabilities in order to use these templates. If your printer can only print text, you can still get the order printed, but in a default plain-text template.</p>
</div>

<div class="how" id="HowToCustomizeTheRestaurantReceipt">
  <h1>How to customize the restaurant receipt</h1>
  <p>To customize your receipts, start from one of these templates and use the restaurant receipt generator to make adjustments as you see fit. You can:</p>
  <ul>
    <li>Change font size for every single line on the receipt;</li>
    <li>Rearrange the sections with simple drag & drop;</li>
    <li>Remove sections that you don’t need;</li>
    <li>Add your own content by using the text-free sections</li>
  </ul>
  <img src="./assets/img/i6.webp"/>
  <p>The best part is that while you make all these changes you can see a real time preview of how your restaurant receipt looks like.</p>
  <p>You can even generate previews for different real life situation by playing with the order type (delivery, pickup, order ahead), payment method (cash, card online etc) or fulfillment time (asap or later). That’s how you make sure that everything looks exactly how you need without having to print tones of test orders.</p>
  <div class="red">
    <img src="./assets/img/i7.webp"/>
  </div>
  <p><strong>Note:</strong> If your printer can only print text (not also images), the receipt comes out in a plain-text format that you cannot customize.</p>
</div>
`,

  contact: `
<h2>Contacto</h2>
<div class="video-row">
  <video controls src="https://www.w3schools.com/html/mov_bbb.mp4"></video>
  <div class="video-text">
    <h4>Video 1: Introducción</h4>
    <p>En este video conocerás los conceptos básicos para iniciar.</p>
  </div>
</div>

<div class="video-row">
  <video controls src="https://www.w3schools.com/html/movie.mp4"></video>
  <div class="video-text">
    <h4>Video 2: Configuración avanzada</h4>
    <p>Aprende a configurar tu entorno de desarrollo paso a paso.</p>
  </div>
</div>
`
};

function getStep3Content(platform) {
  switch (platform) {
    case 'android':
      return `
         <ul>
      <li>Download the <strong>Epson TM Utility</strong> app from Google Play or the App Store.</li>
      <li>Search for “Epson TM Utility” in your app store and install it for free.</li>
      <li>Open the Epson TM Utility app on your mobile device.</li>
      <li>Tap the “Search Printer” button inside the app. The app will automatically scan for Epson printers connected to the local network.</li>
      <li>Select your Epson TM-T20III printer when it appears in the list.</li>
      <li>Perform a test print from the app to verify the printer is detected and working properly.</li>
    </ul>
    <img src="./assets/img/android-setup.jpg" alt="Android setup">
      `;
    case 'ios':
      return `
         <ul>
      <li>Download the <strong>Epson TM Utility</strong> app from the App Store.</li>
      <li>Search for “Epson TM Utility” in your app store and install it for free.</li>
      <li>Open the Epson TM Utility app on your iPhone or iPad.</li>
      <li>Tap the “Search Printer” button inside the app. The app will automatically scan for Epson printers connected to the local network.</li>
      <li>Select your Epson TM-T20III printer when it appears in the list.</li>
      <li>Perform a test print from the app to verify the printer is detected and working properly.</li>
    </ul>
    <img src="./assets/img/ios-setup.jpg" alt="iOS setup">
      `;
    case 'windows':
    default:
      return `
        <ul>
          <li>
        Download <strong>EpsonNet Config</strong> from:
       <a href="https://support.epson.net/setupnavi/?LG2=ES&OSC=WS&MKN=TM-T20III&PINF=menu&linkflg=alllist" target="_blank" style="color: orange; text-decoration: underline;">
  Download here
</a>
     </li>
      <li>Open the software and select your printer from the list.</li>
      <li>Change the IP address if you want to assign a fixed one (recommended).</li>
      <li>Example: <code>192.168.1.200</code> with subnet <code>255.255.255.0</code> and gateway <code>192.168.1.1</code>.</li>
      <li>Download the Epson Advanced Printer Driver (APD) for TM-T20III.</li>
      <li>Install it and go to <strong>Devices and Printers</strong> in Windows.</li>
      <li>Add a printer using its IP address if it’s not detected automatically.</li>
      <li>Select <strong>TCP/IP Device</strong> as the port type.</li>
      <li>Print a test page from Windows.</li>
      <li>Or open a browser and go to <code>http://YOUR-IP</code> to access the printer’s web interface.</li>
        </ul>
        <img src="./assets/img/paso3.jpg" alt="Windows Config">
      `;
  }
}

function activarStep3Subnav() {
  const subnav = document.querySelector('.subnav');
  const content = document.getElementById('step3-content');
  if (!subnav || !content) return;

  // Mostrar contenido por defecto: Windows
  content.innerHTML = getStep3Content('windows');

  subnav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      subnav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      content.innerHTML = getStep3Content(btn.dataset.platform);
    });
  });
}

function setActiveSection(section) {
  contentDiv.innerHTML = sections[section];
  buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));

  // Activa animaciones si existen
  if (typeof activarAnimacionesScroll === "function") {
    activarAnimacionesScroll();
  }

  // Activa subnav Step3 solo en tutorial
  if (section === 'tutorial') {
    setTimeout(activarStep3Subnav, 50); // espera para que el DOM se cargue
  }
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    setActiveSection(btn.dataset.section);
  });
});

// Carga inicial
setActiveSection('tutorial');

