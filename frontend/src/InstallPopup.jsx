import { useEffect, useState } from "react";

export default function InstallPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();

      console.log("👉 beforeinstallprompt triggered");

      setDeferredPrompt(e);
      setShow(true);
    };

   window.addEventListener("beforeinstallprompt", (e) => {
     console.log("PWA OK sur cet appareil");
   });
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installApp = async () => {
    console.log("👉 click install");

    if (!deferredPrompt) {
      console.log("❌ deferredPrompt null");
      return;
    }

    console.log("🚀 calling prompt()");

    deferredPrompt.prompt();

    console.log("⏳ waiting user choice...");

    const choice = await deferredPrompt.userChoice;

    console.log("📊 RESULT =", choice);

    if (!choice) {
      console.log("❌ no choice returned (Chrome blocked?)");
      return;
    }

    if (choice.outcome === "accepted") {
      console.log("🎉 installed");
    } else {
      console.log("⚠️ dismissed");
    }

    setDeferredPrompt(null);
    setShow(false);
  };

  const closePopup = () => {
    setShow(false);
    console.log("❌ popup fermé");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-xl p-4 flex items-center gap-3 z-50 w-[90%] max-w-sm">
      <div className="flex-1">
        <p className="font-semibold">Installer FaceGov</p>
        <p className="text-sm text-gray-500">
          Accès rapide et meilleure expérience
        </p>
      </div>

      <button
        onClick={installApp}
        className="bg-black text-white px-3 py-2 rounded-lg"
      >
        Installer
      </button>

      <button onClick={closePopup} className="text-gray-400 text-lg">
        ✕
      </button>
    </div>
  );
}
