document.getElementById('pdfBtn').addEventListener('click', () => {
  const main = document.querySelector('main');
  const title = (document.querySelector('main h1')?.textContent || 'Runbook').replace(/\s+/g,'_');
  const date = new Date().toISOString().slice(0,10);
  const sections = Array.from(main.querySelectorAll('h2, h3'));
  const opt = { margin:[15,15,15,15], filename:`${title}_${date}.pdf`, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}, pagebreak:{mode:['avoid-all','css','legacy']} };
  html2pdf().set(opt).from(main).toPdf().get('pdf').then(pdf => {
    const originalPages = pdf.internal.getNumberOfPages();
    for (let i=1;i<=originalPages;i++){ pdf.setPage(i); pdf.setFontSize(10); pdf.text(title,10,10); }
    let h2Count=0,h3Count=0;
    sections.forEach(s=>{ if(s.tagName==='H2'){h2Count++;h3Count=0;s.textContent=`${h2Count}. ${s.textContent}`;} else {h3Count++;s.textContent=`${h2Count}.${h3Count} ${s.textContent}`;}});
    if (sections.length>=2){ pdf.insertPage(1); pdf.setPage(1); pdf.setFontSize(16); pdf.text(`${title} — Table of Contents`,10,20); pdf.setFontSize(12); let y=40; sections.forEach((sec,i)=>{ const secTitle=sec.textContent.trim(); pdf.textWithLink(`${secTitle}`,15,y,{pageNumber:i+2}); y+=8; }); }
    const total=pdf.internal.getNumberOfPages();
    for (let i=2;i<=total;i++){ pdf.setPage(i); pdf.setFontSize(9); pdf.setTextColor(150); const text=`Page ${i-1} of ${total-1}`; const w=pdf.internal.pageSize.getWidth(); pdf.text(text, w-40, pdf.internal.pageSize.getHeight()-10, {align:'right'}); pdf.setTextColor(0); }
    let currentH2=null;
    sections.forEach((sec,i)=>{ const t=sec.textContent.trim(); if(sec.tagName==='H2'){ currentH2=pdf.outline.add(null,t,{pageNumber:i+2}); } else if(sec.tagName==='H3' && currentH2){ pdf.outline.add(currentH2,t,{pageNumber:i+2}); }});
  }).save();
});
