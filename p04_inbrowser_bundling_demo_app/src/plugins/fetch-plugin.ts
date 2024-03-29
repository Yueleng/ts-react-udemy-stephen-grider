import { PluginBuild, OnLoadResult, OnLoadArgs } from "esbuild-wasm";
import axios from "axios";
import localForage from "localforage";

const fileCache = localForage.createInstance({
  name: "fileCache",
});

// (async () => {
//   await fileCache.setItem("color", "red");

//   const color = await fileCache.getItem("color");

//   console.log(color);
// })();

export const fetchPlugin = (input: string) => {
  return {
    name: "fetch-plugin",
    setup(build: PluginBuild) {
      build.onLoad({ filter: /(^index\.js$)/ }, (args: OnLoadArgs) => {
        return {
          loader: "jsx",
          contents: input,
        };
      });

      // Deliberate returning null, thus esbuild will look for next filter
      // this way, we can group up same logic
      build.onLoad({ filter: /.*/ }, async (args: OnLoadArgs) => {
        // Check to see if we have already fetched this file
        // and if it is in the cache
        const cachedResult = await fileCache.getItem<OnLoadResult>(args.path);

        // if it is, return it immediately.
        if (cachedResult) {
          return cachedResult;
        }

        return null;
      });

      build.onLoad({ filter: /.css$/ }, async (args: OnLoadArgs) => {
        /**
         * request gives info whether the request is redirected to somewhere
         */
        const { data, request } = await axios.get(args.path);

        console.log(request);

        const escaped = data
          .replace(/\n/g, "")
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"');
        const contents = `
            const style = document.createElement('style');
            style.innerText = '${escaped}';
            document.head.appendChild(style);
          `;

        const result: OnLoadResult = {
          loader: "jsx",
          contents,
          // resovleDir: "nested-test-pkg@1.0.0/src"
          resolveDir: new URL("./", request.responseURL).pathname, // ship to onResolve as containing folder
        };

        // store response in cache
        await fileCache.setItem(args.path, result);

        return result;
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log("onLoad", args);

        /**
         * request gives info whether the request is redirected to somewhere
         */
        const { data, request } = await axios.get(args.path);

        console.log(request);
        const result: OnLoadResult = {
          loader: "jsx",
          contents: data,
          // resovleDir: "nested-test-pkg@1.0.0/src"
          resolveDir: new URL("./", request.responseURL).pathname, // ship to onResolve as containing folder
        };

        // store response in cache
        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};
