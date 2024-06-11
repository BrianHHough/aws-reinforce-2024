import styled from "@emotion/styled";

export const StyledContainer = styled.div`
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
  color: white;

  h1 {
    font-size: 3rem;
    margin: 2rem 0;
    background: linear-gradient(
      90deg,
      #16a085, #2ecc71, #3498db, #59b8f7, #9b59b6, #c982e5, #16a085, #2ecc71, #3498db, #59b8f7, #9b59b6
    );
    background-size: 800% 800%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradientAnimation 25s ease infinite;
  }

  @keyframes gradientAnimation {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;
