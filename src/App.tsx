import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

type Prob = {
  label: string;
  value: number;
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pvImage, setPvImage] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [prediction, setPrediction] = useState<string | undefined>(undefined);
  const [allProbs, setAllProbs] = useState<Prob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPvImage(URL.createObjectURL(e.target?.files?.[0]));
    }
  };

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image_file", file);

    try {
      console.log("This has been clicked");
      const res = await fetch("http://127.0.0.1:8000/classify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        alert(`Problem! ${res.status}`);
        throw new Error(`Whoops. something went wrong. status: ${res.status}`);
      }
      const data = await res.json();
      setData(data);
      setPreview(pvImage);
      console.log("Prediction is", data?.predicted_class);
      const capitalizedPrediction =
        data?.predicted_class.charAt(0).toUpperCase() +
        data?.predicted_class.slice(1);
      setPrediction(capitalizedPrediction);

      const probs: Prob[] = Object.entries(data.all_probs)
        .filter(([label]) => label !== data?.predicted_class)
        .map(([label, value]) => ({
          label,
          value: value as number,
        }));

      setAllProbs(probs);
      console.log("probs are", allProbs);
      console.log("daata is", data);
    } catch (error) {
      setLoading(false);
      console.log("Whoopsie daisy, ", error);
      alert("Something went wrong, whoops! Error code: " + error)
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex w-screen">
      <div className="flex flex-col items-center w-full bg-linear-to-b from-gray-100 to-gray-300 h-screen">
        <header className="w-full text-center mt-9">
          <h1 className="text-2xl font-semibold mb-2 text-gray-800">
            Simple Trash Classifier
          </h1>
        </header>
        <footer className="w-full max-w-3xl text-center items-center">
          <ul className="text-xs text-black opacity-50 text-center">
            <h1 className="text-xs mb-2 text-black text-center">
              Presented by:
            </h1>
            {/* FOOTER TO CREDIT THE GREAT STUDENTS WHO MADE THIS :) */}
            <li>Ahmed Awadallah - 221000354</li>
            <li>Esraa Ahmed - 221000462</li>
            <li>Alhussein Nagdy - 221002149</li>
          </ul>
        </footer>

        {/* INPUT AREA */}
        <div className="w-full max-w-3xl text-black p-6 flex flex-col gap-4">
          <div className="flex justify-between">
            <label htmlFor="file-upload">
              <Button
                asChild
                className="bg-gray-300 cursor-pointer hover:bg-gray-400 transition-colors duration-200"
              >
                <span>Choose Image</span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex items-center gap-4">
              {file && <p>Selected file: {file.name}</p>}
              <Button
                onClick={handleGenerate}
                disabled={loading || !file}
                className={`text-white bg-green-700 cursor-pointer hover:bg-green-900 transition-all duration-200 text-center`}
              >
                Classify
              </Button>
            </div>
          </div>
          <div className="bg-gray-300 rounded-4xl transition-all transition-300">
            {loading ? (
              <div className="bg-gray-200 h-[400px] items-center justify-center flex rounded-4xl">
                <Loader className="animate-spin" size={16} />
              </div>
            ) : data ? (
              <div className="flex items-center gap-7 m-7">
                <div className="inline-block rounded-md border">
                  <img
                    src={preview}
                    className="max-w-64 max-h-64 object-contain rounded-md"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="mb-7">
                    Predicted Class: {prediction} with{" "}
                    {Math.floor(data.confidence * 10000) / 100}% confidence.
                  </span>
                  <span>Overall, the model thought that there was a:</span>
                  {allProbs.map((p) => (
                    <span key={p.label}>
                      {Math.floor(p.value * 10000) / 100}% chance this is a{" "}
                      {p.label.charAt(0).toUpperCase() + p.label.slice(1)}{" "}
                      image.
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-200 h-[400px] items-center justify-center flex rounded-4xl">
                Awaiting Input
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
