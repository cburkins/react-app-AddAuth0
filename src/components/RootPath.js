// src/components/RootPath.js

import React from "react";

const RootPath = props => {
    // console.log("props", props);
    let error_description;
    if (props.location.search.includes("error")) {
        console.error("Whoa, you got this error:", props.location.search);
        const urlParams = new URLSearchParams(window.location.search);
        error_description = urlParams.get("error_description");
        const keys = urlParams.keys();
        for (const key of keys) {
            console.log(`   key:${key}, value:${urlParams.get(key)}`);
        }
    }

    return (
        <div style={{ marginTop: "7vw" }}>
            <div>Hi Chad</div>
            <div>Error Description: {error_description}</div>
        </div>
    );
};

export default RootPath;
