export const getPrintBrandStyles = () => `
  .print-brand {
    align-items: center;
    border-bottom: 2px solid #2563eb;
    display: flex;
    gap: 10px;
    padding-bottom: 10px;
  }
  .print-brand__logo {
    filter: brightness(0) saturate(100%) invert(35%) sepia(92%) saturate(1792%) hue-rotate(208deg) brightness(95%) contrast(94%);
    height: 42px;
    object-fit: contain;
    width: 42px;
  }
  .print-brand__name {
    color: #2563eb;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .print-brand__tagline {
    color: #4b5563;
    font-size: 10px;
    letter-spacing: 0.5px;
    margin-top: 1px;
  }
  @media print {
    .print-brand, .print-brand__name, .print-brand__logo {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
`;

export const getPrintBrandMarkup = (origin: string) => `
  <header class="print-brand">
    <img alt="SOLFIN PERU" class="print-brand__logo" src="${escapePrintHtml(`${origin}/favicon.png`)}" />
    <div>
      <div class="print-brand__name">SOLFIN PERU</div>
      <div class="print-brand__tagline">Solucion Financiera del Peru</div>
    </div>
  </header>
`;

export const escapePrintHtml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

export const printDocument = (printWindow: Window) => {
  const logo = printWindow.document.querySelector<HTMLImageElement>('.print-brand__logo');
  const print = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (!logo || logo.complete) {
    window.setTimeout(print, 100);
    return;
  }

  logo.addEventListener('load', print, { once: true });
  logo.addEventListener('error', print, { once: true });
};
