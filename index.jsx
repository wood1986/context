import React, {memo, useCallback, useContext, useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import uuidv4 from "uuid/v4";

const uuid = () => btoa(String.fromCharCode(...uuidv4(null, []))).
        slice(0, -2). // eslint-disable-line no-magic-numbers
        split("+").
        join("-").
        split("/").
        join("_"),

      ConfigsContext = React.createContext({}, () => 0),

      ConfigComponent = memo((props) => { // eslint-disable-line react/display-name
        const [config, setConfig] = useState({}),
              {setConfigCallback, clearConfigCallback} = useContext(ConfigsContext);

        useEffect(() => {
          const actionFunc = () => new Promise((resolve) => {
            setTimeout(() => {
              resolve({"uuid": uuid()});
            }, 3000); // eslint-disable-line no-magic-numbers
          });
          setConfigCallback(props.id, setConfig, actionFunc);

          return () => {
            clearConfigCallback(props.id, setConfig);
          };
        }, [setConfigCallback, props.id, clearConfigCallback, props]); // eslint-disable-line react/prop-types

        return <div>{config.uuid}</div>;
      }),

      useConfig = (initialConfigs = {}) => {
        const configsRef = useRef(new Map(Object.entries(initialConfigs))),
              callbacksRef = useRef(new Map()),
              setConfigCallback = useCallback((id, setConfig, actionFunc) => { // eslint-disable-line max-statements
                if (configsRef.current.has(id)) {
                  setConfig(configsRef.current.get(id));
                  return;
                }

                const isResolving = !callbacksRef.current.has(id);

                callbacksRef.current = new Map(callbacksRef.current);
                const callbacks = new Set(callbacksRef.current.get(id));
                callbacks.add(setConfig);
                callbacksRef.current.set(id, callbacks);

                if (!isResolving) {
                  let result = actionFunc();

                  if (!(result instanceof Promise)) {
                    result = Promise.resolve(result);
                  }

                  result.then((config) => {
                    configsRef.current = new Map(configsRef.current);
                    configsRef.current.set(id, config);
                    callbacksRef.current.get(id).forEach((setConfig) => setConfig(config)); // eslint-disable-line no-shadow
                    callbacksRef.current = new Map(callbacksRef.current);
                    callbacksRef.current.delete(id);
                  });
                }
              }, []),
              clearConfigCallback = useCallback((id, setConfig) => {
                let callbacks = callbacksRef.current.get(id);
                if (callbacks && callbacks.has(setConfig)) {
                  callbacksRef.current = new Map(callbacksRef.current);
                  callbacks = new Set(callbacksRef.current.get(id));
                  callbacks.delete(setConfig);
                  callbacksRef.current.set(id, callbacks);
                }
              }, []);

        return [setConfigCallback, clearConfigCallback];
      },

      ConfigsContextProvider = (props) => {
        const [setConfigCallback, clearConfigCallback] = useConfig(props.configs); // eslint-disable-line react/prop-types

        return <ConfigsContext.Provider value={{clearConfigCallback, setConfigCallback}}>
          {props.children /* eslint-disable-line react/prop-types */}
        </ConfigsContext.Provider>;
      },

      App = () => {
        const [n, setN] = useState(1); // eslint-disable-line no-magic-numbers
        useEffect(() => {
          setInterval(() => {
            setN((m) => m + 1); // eslint-disable-line id-length
          }, 1000); // eslint-disable-line no-magic-numbers
        }, []);

        return (
          <div>
            {
              Array(n).fill(0).
                map((value, index) => <ConfigComponent key={index} id={index} name={"A"} />)
            }
            <p>--------</p>
            {
              Array(n).fill(0).
                map((value, index) => <ConfigComponent key={index} id={index} name={"B"} />)
            }
          </div>
        );
      };

ReactDOM.render(<ConfigsContextProvider><App /></ConfigsContextProvider>, document.getElementById("root"));
