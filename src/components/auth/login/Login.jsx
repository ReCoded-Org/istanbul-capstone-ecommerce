import React, { useState, useRef } from "react";
import { auth } from "../../config/firebaseConfig";
import db from "../../config/firebaseConfig";
import Button from "react-bootstrap/Button";
import { Col } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Overlay from "react-bootstrap/Overlay";
import Popover from "react-bootstrap/Popover";
import Spinner from "react-bootstrap/Spinner";
import {
  logIn,
  logOut,
  logInError,
  popUpStatus,
} from "../../redux/actions/index";
import { useSelector, useDispatch } from "react-redux";

const ALERT_OPEN_SECONDS = 2500;
const VALIDATING_TEXT = "Validating...";
const LOG_IN_TEXT = "Log in";
const LOG_OUT_TEXT = "Log out";

const LogInForm = () => {
  const { isLoggedIn, isAuthFailed, isAuthSucceeded } = useSelector(
    (state) => state.authentication
  );

  const dispatch = useDispatch();
  const [passwordValue, setPasswordValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [authErrorTargetUi, setAuthErrorTargetUi] = useState(null);
  const authAlertContainerUi = useRef(null);
  const [isValidating, setIsValidating] = useState(false);

  const userLogout = (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
      dispatch(logOut());
      dispatch(logInError(false, false));
      dispatch(popUpStatus(false));
    });
  };

  const userLogin = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    let userLogin;
    try {
      userLogin = await auth.signInWithEmailAndPassword(
        emailValue,
        passwordValue
      );
    } catch (error) {
      dispatch(logInError(true, false));
      setIsValidating(false);
      setTimeout(() => dispatch(logInError(false, false)), ALERT_OPEN_SECONDS);
    }

    if (userLogin) {
      await db
        .collection("users")
        .doc(userLogin.user.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            setIsValidating(false);
            dispatch(logIn(doc.data().name, doc.data().isAdmin));
            dispatch(popUpStatus(true));
            dispatch(logInError(false, true));
            setTimeout(
              () => dispatch(logInError(false, false)),
              ALERT_OPEN_SECONDS
            );
          } else {
            dispatch(logInError(true, false));
            setIsValidating(false);
            setTimeout(
              () => dispatch(logInError(false, false)),
              ALERT_OPEN_SECONDS
            );
          }
        })
        .catch((error) => {
          dispatch(logInError(true, false));
          setIsValidating(false);
          setTimeout(
            () => dispatch(logInError(false, false)),
            ALERT_OPEN_SECONDS
          );
        });
    }
  };

  const handleClick = (e) => {
    setAuthErrorTargetUi(e.target);
  };

  const emailGroup = (
    <Form.Group controlId="formGroupEmail" className="formGroupEmail">
      <Form.Label className="formInputLabel">Email address</Form.Label>
      <div className="formInputWrapper">
        <i className="fas fa-user-circle"></i>
        <Form.Control
          type="email"
          placeholder="Enter email"
          className="formInput"
          onChange={(e) => setEmailValue(e.target.value)}
        />
      </div>
    </Form.Group>
  );

  const passwordGroup = (
    <Form.Group controlId="formGroupPassword">
      <Form.Label className="formInputLabel">Password</Form.Label>
      <div className="formInputWrapper">
        <i className="fas fa-key"></i>
        <Form.Control
          type="password"
          placeholder="Enter your password"
          className="formInput"
          onChange={(e) => setPasswordValue(e.target.value)}
        />
      </div>
    </Form.Group>
  );

  const authErrorUi = (
    <Overlay
      show={isAuthFailed}
      target={authErrorTargetUi}
      placement="bottom"
      container={authAlertContainerUi.current}
      containerPadding={20}
    >
      <Popover>
        <Popover.Title as="h2" className="authFailedText">
          Invalid login or password!
        </Popover.Title>
      </Popover>
    </Overlay>
  );

  const authSuccessUi = (
    <Overlay
      show={isAuthSucceeded}
      target={authErrorTargetUi}
      placement="bottom"
      container={authAlertContainerUi.current}
      containerPadding={20}
    >
      <Popover>
        <Popover.Title as="h2" className="authSucceededText">
          Logged in succesfully!
        </Popover.Title>
      </Popover>
    </Overlay>
  );

  const handleOnSubmit = (e) => {
    if (isLoggedIn) {
      userLogout(e);
    } else {
      userLogin(e);
    }
  };

  const validationButton = (
    <Button variant="info" size="md" className="loginButton" disabled>
      <Spinner
        as="span"
        animation="grow"
        size="sm"
        role="status"
        aria-hidden="true"
        className="validationSpinner"
      />
      {VALIDATING_TEXT}
    </Button>
  );

  const loginButton = (
    <Button
      variant="info"
      size="md"
      className="loginButton"
      type="submit"
      onClick={(e) => handleClick(e)}
    >
      {isLoggedIn ? LOG_OUT_TEXT : LOG_IN_TEXT}
    </Button>
  );

  return (
    <>
      <Col className="signupForm">
        <Form onSubmit={handleOnSubmit} ref={authAlertContainerUi}>
          <fieldset disabled={isAuthSucceeded}>
            {emailGroup}
            {passwordGroup}
            {isValidating ? validationButton : loginButton}
            {isAuthFailed && authErrorUi}
            {isAuthSucceeded && authSuccessUi}
          </fieldset>
        </Form>
      </Col>
    </>
  );
};

export default LogInForm;
