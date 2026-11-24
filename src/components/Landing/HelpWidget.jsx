import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, HelpCircle, Mail, X } from "lucide-react";
import toast from "react-hot-toast";
import { SITE } from "../../config/site";
import ContactSection from "./ContactSection";
import useEscape from "./useEscape";

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  useEscape(open, close);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE.supportEmail);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the email");
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Need help?"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600"
      >
        <HelpCircle size={26} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={close}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">Need Help?</p>
            <h3 id="help-title" className="mt-1 text-2xl font-bold text-navy">
              Any Query?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              If you have any questions or need assistance, feel free to drop us an email. Our team
              will get back to you shortly.
            </p>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <a
                href={`mailto:${SITE.supportEmail}`}
                className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-navy"
              >
                <Mail size={16} className="flex-none" />
                <span className="truncate">{SITE.supportEmail}</span>
              </a>
              <button
                type="button"
                aria-label="Copy support email"
                onClick={copyEmail}
                className="flex-none rounded-lg p-2 text-gray-600 hover:bg-gray-200"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>

            <div className="mt-6">
              <ContactSection variant="modal" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
