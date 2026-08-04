import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Download, ArrowLeft, Printer } from "lucide-react";
import html2pdf from "html2pdf.js";
import { AuthContext } from "../context/AuthContext";
import { formatDate } from "../utils/formatters";

const PrintSingleVendor = () => {
  const { index } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [signName, setSignName] = useState(user?.name || "Admin");
  const [scale, setScale] = useState(1);
  const [vendorMis, setVendorMis] = useState(null);

  useEffect(() => {
    if (index === 'mis-print') {
      const saved = localStorage.getItem("printSingleVendorData");
      if (saved) setVendorMis(JSON.parse(saved));
    } else {
      const saved = localStorage.getItem("vendorMisEntries");
      if (saved) {
        const entries = JSON.parse(saved);
        if (entries[index]) {
          setVendorMis(entries[index]);
        }
      }
    }
  }, [index]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1450) {
        setScale((window.innerWidth - 32) / 1400);
      } else {
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user?.name) setSignName(user.name);
  }, [user]);

  const handleDownloadPDF = () => {
    window.scrollTo(0, 0);
    const element = document.getElementById("single-vendor-content");
    const clone = element.cloneNode(true);
    clone.style.transform = "none";
    clone.style.position = "fixed";
    clone.style.top = "0";
    clone.style.left = "0";
    clone.style.zIndex = "-9999";
    clone.style.width = "1400px";
    clone.style.height = "990px";
    
    const wrapper = document.createElement("div");
    wrapper.className = "print-wrapper";
    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.left = "-9999px";
    wrapper.style.width = "1400px";
    wrapper.style.height = "990px";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    setTimeout(() => {
      const opt = {
        margin: 0,
        filename: `Vendor_Voucher_${vendorMis?.vendorName || index}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, width: 1400, height: 990, windowWidth: 1400, scrollY: 0, scrollX: 0 },
        jsPDF: { unit: 'px', format: [1400, 990], orientation: 'landscape' }
      };
      
      html2pdf().set(opt).from(clone).save().then(() => {
        document.body.removeChild(wrapper);
      }).catch(err => {
        console.error("PDF generation failed:", err);
        document.body.removeChild(wrapper);
      });
    }, 300);
  };

  if (!vendorMis) return <div style={{ padding: "2rem", textAlign: "center" }}><h3>Vendor MIS not found.</h3><button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>Go Back</button></div>;

  const totalAmount = parseFloat(vendorMis?.totalAmount || vendorMis?.details?.reduce((s,p)=>s+(parseFloat(p.amount)||0),0)) || 0;
  const totalOthers = vendorMis?.details?.reduce((s,p)=>s+(parseFloat(p.others)||0),0) || 0;

  return (
    <div style={{ background: "#e2e8f0", minHeight: "100vh", padding: "2rem" }} className="print-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap');
        
        .print-wrapper { font-family: 'Outfit', sans-serif; }
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 1400px !important; max-width: 1400px !important; min-width: 1400px !important; margin: 0; padding: 0; background: white !important; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
          .manifest-table th, .manifest-table td { border-color: #cbd5e1 !important; color: #0f172a !important; }
          .section-header { background-color: #1e293b !important; color: white !important; }
          .gray-cell { background-color: #f1f5f9 !important; }
          .premium-border { border-color: #1e293b !important; }
        }
        .manifest-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; text-align: center; }
        .manifest-table th, .manifest-table td { border: 1px solid #cbd5e1; padding: 4px 8px; color: #0f172a; text-align: center; }
        .gray-cell { background-color: #f8fafc; color: #475569; font-weight: 500; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px; text-align: center; }
        .data-cell { font-weight: 600; color: #0f172a; font-size: 0.75rem; text-align: center; }
        .section-header { background-color: #1e293b; color: #ffffff; padding: 6px 15px; font-weight: 600; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; display: flex; align-items: center; margin-top: 8px; }
        .premium-border { border: 2px solid #1e293b; }
      `}</style>

      <div className="no-print" style={{ maxWidth: "800px", margin: "0 auto 1rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
        <button className="btn" style={{ background: "white", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 600 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="mr-2" /> Back
        </button>
        <div className="top-actions-container">
          <input 
            type="text" 
            value={signName} 
            onChange={(e) => setSignName(e.target.value)} 
            disabled={user?.role !== 'Admin' && user?.role !== 'SuperAdmin'}
            placeholder="Sign Name" 
            style={{ 
              padding: "8px 12px", 
              border: "1px solid #cbd5e1", 
              borderRadius: "6px", 
              fontSize: "0.85rem", 
              width: "160px", 
              outline: "none",
              background: (user?.role === 'Admin' || user?.role === 'SuperAdmin') ? "#ffffff" : "#f1f5f9",
              cursor: (user?.role === 'Admin' || user?.role === 'SuperAdmin') ? "text" : "not-allowed"
            }} 
          />
          <button className="btn" style={{ background: "white", border: "1px solid #cbd5e1" }} onClick={() => window.print()}>
            <Printer size={18} className="mr-2" /> Print Page
          </button>
          <button className="btn btn-primary" style={{ fontWeight: 600, background: "#1e293b", border: "none" }} onClick={handleDownloadPDF}>
            <Download size={18} className="mr-2" /> Download PDF
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", overflow: "hidden", width: "100%", paddingBottom: "2rem" }}>
        <div style={{ width: `${1400 * scale}px`, height: `${990 * scale}px`, position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
          <div id="single-vendor-content" className="print-container" style={{ 
            width: "1400px", height: "990px", background: "white", color: "#0f172a", boxSizing: "border-box", padding: "10px", overflow: "hidden",
            transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0
          }}>
            <div className="premium-border" style={{ height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
              
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", display: "flex", justifyContent: "center", alignItems: "center" }}>
                 <img src="/companylogo.jpg" alt="Watermark" style={{ width: "400px", opacity: 0.05 }} />
              </div>
      
              <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 2rem", borderBottom: "2px solid #1e293b" }}>
                  <div style={{ width: "120px", flexShrink: 0 }}><img src="/companylogo.jpg" alt="Prime Roadways" style={{ width: "100%", height: "auto", borderRadius: "8px" }} /></div>
                  <div style={{ textAlign: "center", flex: 1, padding: "0 15px", minWidth: 0 }}>
                    <h1 style={{ margin: "0 0 2px", fontSize: "1.6rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", color: "#b91c1c" }}>PRIME ROADWAYS</h1>
                    <p style={{ margin: "0 0 2px", fontSize: "1rem", fontWeight: "600", color: "#334155" }}>PLOT NO 292/292A & 292B, OM VIHAR, WEST DELHI, NEW DELHI-110059</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "15px", margin: "2px 0 0", fontSize: "0.9rem", fontWeight: "600", color: "#334155" }}>
                      <span>Contact: +91 7503112217</span><span>|</span><span>info@primeroadways.co.in</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "15px", margin: "2px 0 0", fontSize: "0.9rem", fontWeight: "700", color: "#0f172a" }}>
                      <span>GST: 07BBCPP8550Q1ZX</span><span>|</span><span>PAN: BBCPP8550Q</span>
                    </div>
                  </div>
                  <div style={{ width: "140px", flexShrink: 0, display: "flex", justifyContent: "flex-end", alignSelf: "flex-start" }}>
                    <table style={{ borderCollapse: "collapse", border: "2px solid #1e293b", borderRadius: "6px", overflow: "hidden", backgroundColor: "#f8fafc", width: "120px", textAlign: "center", margin: 0 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: "6px 8px 2px 8px", fontSize: "0.65rem", fontWeight: "700", color: "#475569", letterSpacing: "1px", border: "none" }}>DATE CREATED</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "0px 8px 6px 8px", fontSize: "1.1rem", fontWeight: "800", color: "#e11d48", border: "none" }}>{vendorMis?.createdAt ? formatDate(vendorMis.createdAt) : "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "6px", textAlign: "center", borderBottom: "1px solid #cbd5e1" }}>
                  <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", letterSpacing: "2px", textTransform: "uppercase" }}>VENDOR VEHICLE VOUCHER</h2>
                </div>

                <div style={{ flex: 1, padding: "6px 20px" }}>
                    
                    <div className="section-header">1. Vendor Info</div>
                    <table className="manifest-table">
                        <tbody>
                            <tr>
                                <td className="gray-cell" style={{ width: "20%" }}>VENDOR NAME</td>
                                <td className="data-cell" style={{ width: "80%", color: "#1e3a8a", fontSize: "1.1rem", fontWeight: "800", textAlign: "left", paddingLeft: "20px" }}>{(vendorMis.vendorName || "-").toUpperCase()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="section-header">2. Service Details</div>
                    <table className="manifest-table" style={{ fontSize: "0.75rem", width: "100%" }}>
                        <thead>
                            <tr className="gray-cell" style={{ fontSize: "0.75rem" }}>
                                <th style={{ padding: "8px", whiteSpace: "nowrap" }}>DATE</th>
                                <th style={{ padding: "8px", whiteSpace: "nowrap" }}>VEHICLE NO</th>
                                <th style={{ padding: "8px", whiteSpace: "nowrap" }}>FROM</th>
                                <th style={{ padding: "8px", whiteSpace: "nowrap" }}>TO</th>
                                <th style={{ padding: "8px", whiteSpace: "nowrap" }}>PARTICULAR</th>
                                <th style={{ padding: "8px", whiteSpace: "nowrap" }}>MODE</th>
                                <th style={{ padding: "8px", whiteSpace: "nowrap" }}>HANDOVER TO</th>
                                <th style={{ textAlign: "right", padding: "8px", whiteSpace: "nowrap" }}>OTHERS (₹)</th>
                                <th style={{ textAlign: "right", padding: "8px", whiteSpace: "nowrap" }}>AMOUNT (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendorMis.details && vendorMis.details.length > 0 ? (
                                vendorMis.details.map((p, i) => (
                                    <tr key={i}>
                                        <td className="data-cell" style={{ padding: "8px", whiteSpace: "nowrap" }}>{p.date ? formatDate(p.date) : "-"}</td>
                                        <td className="data-cell" style={{ fontWeight: "700", padding: "8px", whiteSpace: "nowrap" }}>{(p.vehicleNo || "-").toUpperCase()}</td>
                                        <td className="data-cell" style={{ padding: "8px", whiteSpace: "nowrap" }}>{(p.from || "-").toUpperCase()}</td>
                                        <td className="data-cell" style={{ padding: "8px", whiteSpace: "nowrap" }}>{(p.to || "-").toUpperCase()}</td>
                                        <td className="data-cell" style={{ padding: "8px", whiteSpace: "nowrap" }}>{(p.particular || "-").toUpperCase()}</td>
                                        <td className="data-cell" style={{ padding: "8px", whiteSpace: "nowrap" }}>{(p.mode || "-").toUpperCase()}</td>
                                        <td className="data-cell" style={{ padding: "8px", whiteSpace: "nowrap" }}>{(p.handoverTo || "-").toUpperCase()}</td>
                                        <td className="data-cell" style={{ textAlign: "right", padding: "8px", whiteSpace: "nowrap" }}>{parseFloat(p.others || 0).toFixed(2)}</td>
                                        <td className="data-cell" style={{ textAlign: "right", fontWeight: "700", padding: "8px", whiteSpace: "nowrap" }}>{parseFloat(p.amount || 0).toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", padding: "10px" }} className="data-cell">No details available.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="gray-cell" style={{ backgroundColor: "#e2e8f0", fontSize: "0.8rem" }}>
                                <td colSpan="7" style={{ textAlign: "right", fontWeight: "800", color: "#0f172a", padding: "8px", whiteSpace: "nowrap" }}>TOTAL VOUCHER AMOUNT:</td>
                                <td className="data-cell" style={{ textAlign: "right", fontWeight: "700", padding: "8px", whiteSpace: "nowrap" }}>{totalOthers.toFixed(2)}</td>
                                <td className="data-cell" style={{ textAlign: "right", fontWeight: "800", color: "#10b981", padding: "8px", whiteSpace: "nowrap" }}>
                                    Rs. {totalAmount.toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                </div>

                <div style={{ padding: "6px 20px", borderTop: "2px solid #1e293b", background: "#f8fafc", fontSize: "0.8rem", color: "#475569", lineHeight: "1.4" }}>
                  <span className="gray-cell" style={{ padding: "2px 6px", marginRight: "6px", fontSize: "0.7rem" }}>NOTE</span>
                  This is a computer generated voucher for vendor payment processing.
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "10px 2rem", height: "80px" }}>
                  <div style={{ textAlign: "center", width: "200px" }}>
                    <div style={{ height: "40px", marginBottom: "5px" }}></div>
                    <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "5px", fontSize: "0.9rem", fontWeight: "600", color: "#475569" }}>
                      VENDOR SIGNATURE
                    </div>
                  </div>
                  
                  <div style={{ textAlign: "center", width: "250px" }}>
                    {(user?.role === 'Admin' || user?.role === 'SuperAdmin') ? (
                      <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: "2rem", color: "#0f172a", height: "40px", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: "5px" }}>
                        {signName}
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.85rem", color: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "40px", marginBottom: "5px", fontWeight: "600" }}>
                        <span>Digitally signed by Dharmendra Puri</span>
                        <span>Prime Roadways</span>
                      </div>
                    )}
                    <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "5px", fontSize: "0.9rem", fontWeight: "600", color: "#475569" }}>
                      AUTHORIZED SIGNATURE
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintSingleVendor;
