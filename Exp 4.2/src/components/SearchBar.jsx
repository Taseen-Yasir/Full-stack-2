import React from "react";
import { FaSearch, FaUndo, FaTrash } from "react-icons/fa";

function SearchBar({

    search,
    setSearch,
    restoreEvents,
    clearEvents

}){

    return(

        <div className="searchBar">

            <div className="searchBox">

                <FaSearch className="searchIcon"/>

                <input

                    type="text"

                    placeholder="Search posts..."

                    value={search}

                    onChange={(e)=>setSearch(e.target.value)}

                />

            </div>

            <div className="actionButtons">

                <button

                    className="restoreBtn"

                    onClick={restoreEvents}

                >

                    <FaUndo/>

                    Restore Samples

                </button>

                <button

                    className="clearBtn"

                    onClick={clearEvents}

                >

                    <FaTrash/>

                    Clear Calendar

                </button>

            </div>

        </div>

    );

}

export default React.memo(SearchBar);