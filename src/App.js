import React, { useState } from "react";
import classes from "./App.module.css";
import logo from "./logo.png";
import app from "./firebaseConfig.js";
import { useEffect, useReducer } from "react";
import { getDatabase, get, ref, update } from "firebase/database";

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
    case "stateSelected":
      return { ...state, city: action.payload, port: "", port2: "" };
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
  const [{ auction, state, city, port, port2 }, dispatch] = useReducer(
    reducer,
    initialState
  );

  const getData = async (auc) => {
    try {
      const db = getDatabase(app);
      const auction = ref(db, auc);
      const snapshot = await get(auction);
      dispatch({ type: "auctionSelected", payload: snapshot.val() });
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
      return state.find((option) => option.text === textToFind);
    };
    const selectedCity = findByText(e.target.value);
    dispatch({ type: "stateSelected", payload: selectedCity.cities });
  };
  const citySelectionHandle = (e) => {
    e.preventDefault();
    const findByText = (textToFind) => {
      return city?.find((option) => option.text === textToFind);
    };
    const selectedPort = findByText(e.target.value);
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
    if (currentTarget) {
      try {
        const db = getDatabase(app);

        // Find the selected city in the state data
        const selectedStateIndex = state.findIndex((el) => {
          return (
            el.cities &&
            el.cities.some((cit) => cit.text === currentTarget.text)
          );
        });

        if (selectedStateIndex !== -1) {
          const cityIndex = state[selectedStateIndex].cities.findIndex(
            (cit) => cit.text === currentTarget.text
          );

          if (cityIndex !== -1) {
            const dbRef = ref(
              db,
              `${auction}/${selectedStateIndex}/cities/${cityIndex}`
            );

            // Prepare the data to update
            const updateData = {
              price: port, // Always update the port value
            };

            // Only add port2 if it exists
            if (port2) {
              updateData.price2 = port2;
            }

            // Update Firebase with the prepared data
            await update(dbRef, updateData);

            getData(auction);
          } else {
            console.warn("City not found in the state's cities array.");
          }
        } else {
          console.warn("State or city not found.");
        }
      } catch (warn) {
        console.warn("warning! updating city in Firebase:", warn);
      }
    }
  };

  useEffect(() => {
    currentTarget.port = port;
  }, [port, port2, currentTarget]);
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
              {state &&
                state.map((el) => {
                  return <option key={el.text}>{el.text}</option>;
                })}
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
          disabled={(currentTarget.length = 0 ? true : false)}
        >
          SET
        </button>
      </div>
    </div>
  );
}

export default App;
