"use client";
import { useState, useEffect, useRef } from "react";
import { Send, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";
import { Reveal, RevealLines } from "../Landing/Primitives";

export default function ContactPage({ variant = "section" }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const sectionRef = useRef(null);

  /* Animate on scroll */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Name is required";

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.message.trim()) errors.message = "Message is required";

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    setSubmitError("");
    setSubmitSuccess(false);

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);

      const apiUrl = `${process.env.REACT_APP_API_URL}/api/contact`;

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            companyName: formData.company,
            message: formData.message,
            source: "Advent-Tech",
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSubmitSuccess(true);
          setFormData({
            name: "",
            email: "",
            phone: "",
            company: "",
            message: "",
          });
        } else {
          setSubmitError(data.message || "Failed to submit lead. Please try again.");
          console.error("API Error:", data);
        }
      } catch (err) {
        setSubmitError("An unexpected network error occurred.");
        console.error("Submit error", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isModal = variant === "modal";

  const infoItems = [
    {
      icon: <MapPin size={20} />,
      title: "Our Location",
      body: (
        <>
          WeWork - Krishe Emerald, Ground Floor, Laxmi Cyber City,
          HITECH City, Hyderabad, Telangana - 500082
        </>
      ),
    },
    { icon: <Phone size={20} />, title: "Phone", body: "+91 73299 99968" },
    { icon: <Mail size={20} />, title: "Email", body: "info@adventglobal.com" },
  ];

  const formEl = (
    <form
      onSubmit={handleSubmit}
      className={
        isModal
          ? "relative"
          : "lg:col-span-3 relative bg-[#f8f4ed] rounded-[28px] shadow-[0_40px_80px_-50px_rgba(12,30,91,0.6)] border border-[#0c1e5b]/10 p-7 md:p-11"
      }
    >
      <h3
        className={`lp-heading font-semibold text-[#0c1e5b] ${
          isModal ? "text-xl mb-5" : "text-2xl md:text-3xl mb-8"
        }`}
      >
        Send Us a Message
      </h3>

      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 font-medium flex items-center gap-2">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          Thank you! We'll get back to you shortly.
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 font-medium">
          {submitError}
        </div>
      )}

      <div className={isModal ? "space-y-3" : "space-y-4"}>
        <div>
          <input
            name="name"
            placeholder="Full Name*"
            value={formData.name}
            onChange={handleChange}
            className="lp-input"
          />
          {formErrors.name && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {formErrors.name}
            </p>
          )}
        </div>

        <div className={`grid md:grid-cols-2 ${isModal ? "gap-3" : "gap-4"}`}>
          <div>
            <input
              name="email"
              placeholder="Email*"
              value={formData.email}
              onChange={handleChange}
              className="lp-input"
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-2 font-medium">
                {formErrors.email}
              </p>
            )}
          </div>

          <input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            className="lp-input"
          />
        </div>

        <input
          name="company"
          placeholder="Company"
          value={formData.company}
          onChange={handleChange}
          className="lp-input"
        />

        <div>
          <textarea
            name="message"
            rows={isModal ? 3 : 4}
            placeholder="Message*"
            value={formData.message}
            onChange={handleChange}
            className="lp-input resize-none"
          />
          {formErrors.message && (
            <p className="text-red-500 text-sm mt-2 font-medium">
              {formErrors.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="lp-btn lp-btn-orange text-white w-full justify-center !py-4 mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_18px_40px_-16px_rgba(249,115,22,0.9)]"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
          <Send size={16} />
        </button>
      </div>
    </form>
  );

  if (isModal) return formEl;

  return (
    <main className="relative bg-[#e3e8f3] overflow-hidden">
      <div className="absolute inset-0 lp-line-grid [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />

      {/* HERO */}
      <section className="relative pt-24 md:pt-28 pb-14 text-center px-6">
        <RevealLines
          as="h1"
          className="lp-display font-bold text-[clamp(1.8rem,4.1vw,3.9rem)] text-[#0c1e5b] mb-6"
          lines={[<>Contact <span className="text-orange-500">Us</span></>]}
        />
        <Reveal delay={0.15}>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-[#0c1e5b]/65 leading-relaxed">
            We'd love to hear from you. Reach out to discuss how we can help with
            your technology needs.
          </p>
        </Reveal>
      </section>

      {/* CONTACT */}
      <section
        ref={sectionRef}
        className="relative pb-24 md:pb-28 px-4 md:px-6 opacity-0 translate-y-10 transition-all duration-700"
      >
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-5 items-stretch">
          {/* LEFT INFO */}
          <div className="lg:col-span-2 relative bg-[#0c1e5b] text-white rounded-[28px] p-8 lg:p-11 flex flex-col justify-center overflow-hidden">
            <span className="absolute inset-0 lp-dot-grid-dark lp-drift opacity-70" />
            <span className="absolute -right-24 -bottom-24 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.55),transparent_65%)]" />
            <span className="absolute top-8 right-8 flex items-center justify-center w-10 h-10">
              <span className="absolute w-10 h-10 rounded-full border border-orange-400/60 animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            </span>

            <h3 className="relative lp-heading text-2xl md:text-3xl font-semibold mb-4">
              Contact Information
            </h3>
            <p className="relative text-white/65 mb-10 leading-relaxed">
              Reach out to us for a consultation or to learn more about our
              services. Our team is ready to assist you.
            </p>

            <div className="relative space-y-7">
              {infoItems.map((item, i) => (
                <div key={item.title} className="group flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-orange-500 text-orange-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 flex items-center gap-3">
                      {item.title}
                      <span className="lp-mono text-[10px] text-white/30 font-normal">0{i + 1}</span>
                    </h4>
                    <p className="text-white/60 text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT FORM */}
          {formEl}
        </div>
      </section>
    </main>
  );
}
