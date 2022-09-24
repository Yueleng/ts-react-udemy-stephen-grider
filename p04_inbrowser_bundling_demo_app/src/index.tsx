import * as esbuild from "esbuild-wasm";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

const App = () => {
  const ref = useRef<any>();
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");

  const onSubmit = useCallback(() => {
    if (!ref.current) {
      return;
    }

    // const result = ref.current.transform(input, {
    //   loader: "jsx",
    //   target: "es2015",
    // });

    const result = ref.current.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        "process.env.NODE_ENV": '"production"',
        gloabl: "window",
      },
    });

    result.then((res: any) => {
      console.log(res);
      setCode(res.outputFiles[0].text);
    });
  }, [input]);

  const html = useMemo(() => `<script> ${code}</script>`, [code]);

  const startService = async () => {
    await esbuild.initialize({
      worker: true,
      // wasmURL: "/esbuild.wasm",
      wasmURL: "https://unpkg.com/esbuild-wasm@0.14.21/esbuild.wasm",
    });
    ref.current = esbuild;
  };

  useEffect(() => {
    startService();
  }, []);

  return (
    <div>
      <textarea onChange={(e) => setInput(e.target.value)}></textarea>
      <div>
        <button onClick={onSubmit}>Submit</button>
      </div>
      <pre>{code}</pre>
      <iframe
        title="code-execution-result"
        sandbox="allow-scripts"
        srcDoc={html}
      ></iframe>
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector("#root"));

// result of transpiling `
//  const asyncFun = async (x) => {
//    await callApi(x);
//  }
// `
// var __async = (__this, __arguments, generator) => {
//   return new Promise((resolve, reject) => {
//     var fulfilled = (value) => {
//       try {
//         step(generator.next(value));
//       } catch (e) {
//         reject(e);
//       }
//     };
//     var rejected = (value) => {
//       try {
//         step(generator.throw(value));
//       } catch (e) {
//         reject(e);
//       }
//     };
//     var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
//     step((generator = generator.apply(__this, __arguments)).next());
//   });
// };
// const asyncFun = (x) => __async(this, null, function* () {
//   yield callApi();
// });
