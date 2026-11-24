import { useEffect, useRef, useState } from "react";
import { Building2, CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { SITE } from "../../config/site";

const EMPTY_FORM = { name: "", email: "", phone: "", company: "", message: "" };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Full name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Enter a valid email address";
  if (!form.message.trim()) errors.message = "Message is required";
  return errors;
}

function Field({ label, name, required, error, children }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-orange-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ContactForm({ idPrefix }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (sent) setSent(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    // Demo only: simulate a successful send, no request is made.
    setSending(true);
    const firstName = form.name.trim().split(/\s+/)[0];
    timer.current = setTimeout(() => {
      setSending(false);
      setSent(true);
      setForm(EMPTY_FORM);
      toast.success(`Thanks ${firstName}, your message has been sent!`);
    }, 800);
  };

  const inputClass = (name) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-500 ${
      errors[name] ? "border-red-400" : "border-gray-300"
    }`;

  const id = (name) => `${idPrefix}-${name}`;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" name={id("name")} required error={errors.name}>
          <input id={id("name")} name="name" value={form.name} onChange={onChange} className={inputClass("name")} />
        </Field>
        <Field label="Email" name={id("email")} required error={errors.email}>
          <input id={id("email")} name="email" type="email" value={form.email} onChange={onChange} className={inputClass("email")} />
        </Field>
        <Field label="Phone" name={id("phone")}>
          <input id={id("phone")} name="phone" type="tel" value={form.phone} onChange={onChange} className={inputClass("phone")} />
        </Field>
        <Field label="Company" name={id("company")}>
          <input id={id("company")} name="company" value={form.company} onChange={onChange} className={inputClass("company")} />
        </Field>
      </div>
      <Field label="Message" name={id("message")} required error={errors.message}>
        <textarea id={id("message")} name="message" rows={4} value={form.message} onChange={onChange} className={inputClass("message")} />
      </Field>

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "Sending..." : "Send Message"}
      </button>

      {sent && (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 size={18} />
          Thanks! We'll get back to you shortly.
        </p>
      )}
    </form>
  );
}

const INFO = [
  { icon: MapPin, title: "Corporate Headquarters", value: SITE.address },
  { icon: Phone, title: "Phone", value: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
  { icon: Mail, title: "Email", value: SITE.infoEmail, href: `mailto:${SITE.infoEmail}` },
];

export default function ContactSection({ variant = "section" }) {
  if (variant === "modal") return <ContactForm idPrefix="help" />;

  return (
    <section id="contact" className="scroll-mt-24 bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">Get in Touch</p>
          <h2 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">
            Contact <span className="text-orange-500">Us</span>
          </h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {INFO.map(({ icon: Icon, title, value, href }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{title}</h3>
                  {href ? (
                    <a href={href} className="mt-1 block text-sm text-gray-600 hover:text-navy">
                      {value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-gray-600">{value}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-navy">Other Offices</h3>
                <ul className="mt-1 space-y-2 text-sm text-gray-600">
                  {SITE.offices.map(({ city, address }) => (
                    <li key={city}>
                      <span className="font-medium text-gray-700">{city}:</span> {address}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-3">
            <ContactForm idPrefix="contact" />
          </div>
        </div>
      </div>
    </section>
  );
}
