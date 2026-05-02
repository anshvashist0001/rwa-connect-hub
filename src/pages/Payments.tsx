import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CreditCard, Upload, Search, CheckCircle, Clock, XCircle, AlertCircle, Eye } from "lucide-react";
import { paymentsApi, type Payment } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { getFees } from "@/lib/feeConfig";

const statusIcon = {
  approved: <CheckCircle className="w-4 h-4 text-success" />,
  pending: <Clock className="w-4 h-4 text-warning" />,
  rejected: <XCircle className="w-4 h-4 text-destructive" />,
};

const PAYMENT_TYPES = getFees();

const empty = { name: "", phone: "", block: "", house_no: "", amount: "", paymentType: "Maintenance Fee" };
const noErrors = { name: "", phone: "", block: "", house_no: "", amount: "", file: "" };

const FieldError = ({ msg }: { msg: string }) =>
  msg ? (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  ) : null;

const Payments = () => {
  const [activeTab, setActiveTab] = useState<"submit" | "check">("submit");
  const [formData, setFormData] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState(noErrors);
  const [submitted, setSubmitted] = useState(false);
  const [checkPhone, setCheckPhone] = useState("");
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitMutation = useMutation({
    mutationFn: (fd: FormData) => paymentsApi.submit(fd),
    onSuccess: (data) => {
      setSubmittedId(data.payment.id);
      setFormData(empty);
      setFile(null);
      setErrors(noErrors);
      setSubmitted(false);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Payment submitted! Pending verification.");
    },
    onError: () => {
      import("@/lib/demoStore").then(({ demoPayments }) => {
        const proceedWithPayment = (screenshot_url: string | null) => {
          const newPayment = demoPayments.create({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            block: formData.block.trim(),
            house_no: formData.house_no.trim(),
            amount: formData.amount,
            payment_type: formData.paymentType,
            status: "pending",
            remarks: null,
            screenshot_url
          });
          
          setSubmittedId(newPayment.id);
          setFormData(empty);
          setFile(null);
          setErrors(noErrors);
          setSubmitted(false);
          if (fileRef.current) fileRef.current.value = "";
          toast.success("Payment submitted (Local Mode)!");
        };

        if (file) {
          proceedWithPayment(URL.createObjectURL(file));
        } else {
          proceedWithPayment(null);
        }
      });
    },
  });

  const { data: checkedPayments, refetch: checkStatus, isFetching: checking, isError: checkError } = useQuery({
    queryKey: ["payment-status", checkPhone],
    queryFn: async () => {
      try {
        const result = await paymentsApi.checkStatus(checkPhone);
        return result.length > 0 ? result : [];
      } catch {
        const { demoPayments } = await import("@/lib/demoStore");
        return demoPayments.getAll().filter((p) => String(p.phone) === String(checkPhone));
      }
    },
    enabled: false,
  });

  const validate = () => {
    const e = { ...noErrors };
    let valid = true;

    if (!formData.name.trim()) { e.name = "Full name is required"; valid = false; }
    else if (formData.name.trim().length < 3) { e.name = "Enter a valid full name"; valid = false; }

    if (!formData.phone.trim()) { e.phone = "Phone number is required"; valid = false; }
    else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) { e.phone = "Enter a valid 10-digit Indian mobile number"; valid = false; }

    if (!formData.block.trim()) { e.block = "Block is required"; valid = false; }
    if (!formData.house_no.trim()) { e.house_no = "House number is required"; valid = false; }

    if (!formData.amount) { e.amount = "Amount is required"; valid = false; }
    else if (parseFloat(formData.amount) <= 0) { e.amount = "Amount must be greater than 0"; valid = false; }

    // if (!file) { e.file = "Payment screenshot is required"; valid = false; }

    setErrors(e);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) return;

    const fd = new FormData();
    fd.append("name", formData.name.trim());
    fd.append("phone", formData.phone.trim());
    fd.append("block", formData.block.trim());
    fd.append("house_no", formData.house_no.trim());
    fd.append("amount", formData.amount);
    fd.append("payment_type", formData.paymentType);
    if (file) fd.append("screenshot", file);
    submitMutation.mutate(fd);
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(checkPhone.trim())) return toast.error("Enter a valid 10-digit mobile number");
    checkStatus();
  };

  const inputClass = (field: keyof typeof noErrors) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-colors ${
      submitted && errors[field] ? "border-destructive focus:ring-destructive/30" : "border-input"
    }`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-2xl">
          <div className="mb-10">
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Membership</p>
            <h1 className="text-3xl md:text-5xl font-bold">Payments</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("submit")}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "submit" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Submit Payment
            </button>
            <button
              onClick={() => setActiveTab("check")}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "check" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Check Status
            </button>
          </div>

          {activeTab === "submit" && (
            <div className="bg-card rounded-lg border border-border p-6 md:p-8">
              {/* Bank details */}
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-5 mb-6">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent" />
                  RWA Bank Account Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Name</p>
                    <p className="font-medium">RWA Shyam Kunj</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-medium font-mono">1234 5678 9012 3456</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IFSC Code</p>
                    <p className="font-medium font-mono">SBIN0001234</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="font-medium">State Bank of India</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">UPI ID</p>
                    <p className="font-medium font-mono">greenvalleyrwa@sbi</p>
                  </div>
                </div>
              </div>

              <div className="bg-accent/10 rounded-lg p-4 mb-6">
                <p className="text-sm text-foreground font-medium mb-1">Payment Instructions</p>
                <p className="text-xs text-muted-foreground">
                  1. Pay via UPI/Bank Transfer using the account details above<br />
                  2. Take a screenshot of the payment confirmation<br />
                  3. Fill the form below and upload the screenshot
                </p>
              </div>

              {submittedId && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Payment submitted successfully!</p>
                    <p className="text-xs text-muted-foreground">Reference ID: #{submittedId} · Status: Pending verification</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                {/* Payment Type */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Payment Type <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PAYMENT_TYPES.map((pt) => (
                      <button
                        key={pt.label}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          paymentType: pt.label,
                          amount: pt.amount || formData.amount,
                        })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-all ${
                          formData.paymentType === pt.label
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-background border-input text-foreground hover:border-accent/50"
                        }`}
                      >
                        <span className="block">{pt.label}</span>
                        {pt.amount && (
                          <span className={`text-[10px] ${formData.paymentType === pt.label ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                            ₹{parseInt(pt.amount).toLocaleString('en-IN')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass("name")}
                    placeholder="Enter your full name"
                  />
                  <FieldError msg={submitted ? errors.name : ""} />
                </div>

                {/* Phone & Flat */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Phone <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/, "") })}
                      className={inputClass("phone")}
                      placeholder="9876543210"
                    />
                    <FieldError msg={submitted ? errors.phone : ""} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Block <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={formData.block}
                      onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                      className={inputClass("block")}
                      placeholder="e.g. A"
                    />
                    <FieldError msg={submitted ? errors.block : ""} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      House No. <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={formData.house_no}
                      onChange={(e) => setFormData({ ...formData, house_no: e.target.value })}
                      className={inputClass("house_no")}
                      placeholder="e.g. 101"
                    />
                    <FieldError msg={submitted ? errors.house_no : ""} />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Amount (₹) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={inputClass("amount")}
                    placeholder="Enter amount"
                  />
                  <FieldError msg={submitted ? errors.amount : ""} />
                </div>

                {/* Screenshot */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Payment Screenshot (Optional)
                  </label>
                  <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    submitted && errors.file
                      ? "border-destructive bg-destructive/5"
                      : file
                      ? "border-success/50 bg-success/5"
                      : "border-input hover:border-accent/50"
                  }`}>
                    {file ? (
                      <CheckCircle className="w-8 h-8 text-success" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground">{file ? file.name : "Click to upload or drag & drop"}</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <FieldError msg={submitted ? errors.file : ""} />
                </div>

                <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Submitting..." : "Submit Payment"}
                </Button>
              </form>
            </div>
          )}

          {activeTab === "check" && (
            <div className="bg-card rounded-lg border border-border p-6 md:p-8">
              <p className="text-sm text-muted-foreground mb-4">Enter the phone number you used while submitting your payment.</p>
              <form onSubmit={handleCheck} className="flex gap-3 mb-6">
                <input
                  required
                  type="tel"
                  maxLength={10}
                  value={checkPhone}
                  onChange={(e) => setCheckPhone(e.target.value.replace(/\D/, ""))}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter 10-digit phone number"
                />
                <Button type="submit" variant="accent" disabled={checking}>
                  {checking ? "..." : "Check"}
                </Button>
              </form>

              {checkError && (
                <p className="text-sm text-destructive text-center">Could not fetch payment status. Try again.</p>
              )}

              {checkedPayments && checkedPayments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No payment records found for this number.</p>
              )}

              {checkedPayments && checkedPayments.length > 0 && (
                <div className="space-y-3">
                  {checkedPayments.map((p: Payment) => (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                      <div>
                        <p className="text-sm font-medium">₹{parseFloat(p.amount).toLocaleString('en-IN')} · {p.payment_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(p.created_at), 'dd MMM yyyy')} · Block {p.block}-{p.house_no}
                        </p>
                        {p.remarks && <p className="text-xs text-muted-foreground mt-0.5">Remarks: {p.remarks}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                          {statusIcon[p.status as keyof typeof statusIcon]}
                          <span className="text-sm font-medium capitalize">{p.status}</span>
                        </div>
                        {p.screenshot_url && p.screenshot_url !== "null" && (
                          <a
                            href={p.screenshot_url.startsWith("http") ? p.screenshot_url : (p.screenshot_url.startsWith("blob:") || p.screenshot_url.startsWith("data:") ? p.screenshot_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${p.screenshot_url}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 text-accent hover:underline"
                          >
                            <Eye className="w-3 h-3" /> View Screenshot
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Payments;
