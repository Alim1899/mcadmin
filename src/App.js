import React, { useState } from "react";
import classes from "./App.module.css";
import logo from "./logo.png";
import app from "./firebaseConfig.js";
import { useEffect, useReducer } from "react";
import { getDatabase, get, ref, set, update } from "firebase/database";
import canada from "./data/canada.json";
import copart from "./data/copart.json";
import iaai from "./data/iaai.json";
import manhaim from "./data/manhaim.json";
import sub_copart from "./data/sub_copart.json";
import sub_iaai from "./data/sub_iaai.json";
function normalizeString(str) {
  return str
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing spaces
    .replace(/\s+/g, " "); // Replace multiple spaces with one
}
const initialState = {
  auction: "",
  state: "",
  city: "",
  port: "",
  port2: "",
};
const reducer = (state, action) => {
  switch (action.type) {
    case "getData":
      return { initialState, auction: action.payload };
    case "auctionSelected":
      return { ...state, state: action.payload, city: "", port: "", port2: "" };
    case "auctionReSelected":
      return { ...state, city: "", port: "", port2: "" };
    case "stateSelected":
      return { ...state, city: action.payload, port: "", port2: "" };
    case "reset":
      return { initialState };
    case "citySelected":
      return {
        ...state,
        port: action.payload.port,
        port2: action.payload.port2,
      };
    case "priceChanged":
      return {
        ...state,
        port: action.payload,
      };
    case "price2Changed":
      return {
        ...state,
        port2: action.payload,
      };
    default:
      throw new Error("Unknown action typpe");
  }
};
function App() {
  const [currentTarget, setCurrentTarget] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [{ auction, state, city, port, port2 }, dispatch] = useReducer(
    reducer,
    initialState
  );

  const getData = async (auc) => {
    try {
      const db = getDatabase(app);
      const auction = ref(db, auc);
      const snapshot = await get(auction);
      dispatch({
        type: "auctionSelected",
        payload: Object.entries(snapshot.val()),
      });
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };
  const auctionSelectionHandle = (e) => {
    e.preventDefault();
    dispatch({
      type: "getData",
      payload: e.target.options[e.target.selectedIndex].id,
    });
  };
  const stateSelectionHandle = (e) => {
    e.preventDefault();
    const findByText = (textToFind) => {
      return state?.find((option) => option[0] === textToFind);
    };
    const selectedCity = findByText(e.target.value);
    if (selectedCity) {
      setSelectedState(e.target.value);
      dispatch({ type: "stateSelected", payload: selectedCity[1].cities });
    } else {
      dispatch({ type: "auctionReSelected" });
    }
  };

  const citySelectionHandle = (e) => {
    e.preventDefault();

    const findByText = (textToFind) => {
      return city?.find((option) => {
        return normalizeString(option.text) === textToFind;
      });
    };
    const selectedPort = findByText(normalizeString(e.target.value));

    dispatch({
      type: "citySelected",
      payload: {
        port: selectedPort.price || "",
        port2: selectedPort.price2 || "",
      },
    });
    setCurrentTarget(selectedPort);
  };

  useEffect(() => {
    if (auction) getData(auction);
  }, [auction]);

  const setPrice = async () => {
    setShowSpinner(true);
    const cityIndex = city.findIndex((cit) => cit.text === currentTarget.text);
    if (city[cityIndex].price2 === "") {
      delete city[cityIndex].price2;
    }
    if (currentTarget) {
      try {
        const db = getDatabase(app);
        const dbRef = ref(
          db,
          `${auction}/${selectedState}/cities/${cityIndex}`
        );
        await update(dbRef, city[cityIndex]).then(() => {
          dispatch({ type: "reset" });
          alert("✅");
          setShowSpinner(false);
        });
      } catch (warn) {
        console.warn("warning! updating city in Firebase:", warn);
      }
    }
  };

  useEffect(() => {
    currentTarget.price = port;
    currentTarget.price2 = port2;
  }, [port, port2, currentTarget]);

  const reset = async (e) => {
    e.preventDefault();
    setShowSpinner(true);
    try {
      const db = getDatabase(app);
      const copRef = ref(db, `/copart`);
      const iaRef = ref(db, `/iaai`);
      const canRef = ref(db, `/canada`);
      const manRef = ref(db, `/manhaim`);
      const subCopRef = ref(db, `/sub_copart`);
      const subIaRef = ref(db, `/sub_iaai`);
      await set(copRef, copart);
      await set(iaRef, iaai);
      await set(canRef, canada);
      await set(manRef, manhaim);
      await set(subCopRef, sub_copart);
      await set(subIaRef, sub_iaai);
      alert("RESETT✅");
      setShowSpinner(false);
    } catch (warn) {
      console.warn("warning! updating city in Firebase:", warn);
    }
  };

  return (
    <div className={classes.main}>
      <div className={classes.form}>
        <img src={logo} alt="logo"></img>
        <div className={classes.fields}>
          <label htmlFor="auction">
            Auction:
            <select
              id="auction"
              onChange={(e) => auctionSelectionHandle(e)}
              className={classes.select}
            >
              <option id="">Choose</option>
              <option id="copart">Copart</option>
              <option id="iaai">IAAI</option>
              <option id="manhaim">Manheim</option>
              <option id="canada">Canada</option>
              <option id="sub_copart">SUBLOT COPART</option>
              <option id="sub_iaai">SUBLOT IAAI</option>
            </select>
          </label>

          <label htmlFor="state">
            State:
            <select
              className={classes.select}
              disabled={state ? false : true}
              id="state"
              onChange={(e) => stateSelectionHandle(e)}
            >
              {state && (
                <>
                  <option value="">Choose</option>
                  {state.map((el) => {
                    return (
                      <option key={el[0]} value={el[1].text}>
                        {el[1].text}
                      </option>
                    );
                  })}
                </>
              )}
              {!state && <option>Choose</option>}
            </select>
          </label>

          <label htmlFor="city">
            City:
            <select
              id="city"
              onChange={(e) => citySelectionHandle(e)}
              className={classes.select}
              disabled={city ? false : true}
            >
              {!city && <option>Choose</option>}
              {city &&
                city.map((city) => {
                  return <option key={city.text}>{city.text}</option>;
                })}
            </select>
          </label>
        </div>
        <div className={classes.ports}>
          {port && (
            <input
              value={port}
              onChange={(e) =>
                dispatch({ type: "priceChanged", payload: e.target.value })
              }
            ></input>
          )}
          {port2 && (
            <input
              value={port2}
              onChange={(e) =>
                dispatch({ type: "price2Changed", payload: e.target.value })
              }
            ></input>
          )}
        </div>
        <button
          className={classes.setBtn}
          onClick={(e) => {
            setPrice(e);
          }}
          disabled={!port}
        >
          SET
        </button>
        <button
          className={classes.setBtn}
          onClick={(e) => {
            reset(e);
          }}
        >
          RESET
        </button>

        {showSpinner && (
          <div className={classes.spinnerContainer}>
            <div className={classes.spinner}></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
