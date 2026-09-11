export default function Dashboard({events}){

const today=new Date().toISOString().slice(0,10);

const todayPosts=events.filter(e=>e.date===today);

return(

<div className="cards">

<div className="card">

<h3>Total Posts</h3>

<h1>{events.length}</h1>

</div>

<div className="card">

<h3>Today's Posts</h3>

<h1>{todayPosts.length}</h1>

</div>

<div className="card">

<h3>Platforms</h3>

<h1>4</h1>

</div>

<div className="card">

<h3>Status</h3>

<h1>Active</h1>

</div>

</div>

)

}