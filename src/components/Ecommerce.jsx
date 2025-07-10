import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Ecommerce.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Ecommerce() {
  const [usuario, setUsuario] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [alias, setAlias] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasenaLogin, setMostrarContrasenaLogin] = useState(false);
  const [mostrarContrasenaRegistro, setMostrarContrasenaRegistro] =
    useState(false);
  const [error, setError] = useState("");
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);
  const [mostrarAgregar, setMostrarAgregar] = useState(false);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    imagen: "",
    stock: "",
  });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    obtenerProductos();
  }, []);

  const obtenerProductos = () => {
    axios
      .get("http://localhost:3000/api/productos")
      .then((res) => {
        const productosConImagen = res.data.map((prod) => ({
          ...prod,
          imagen: prod.imagen || "https://via.placeholder.com/150",
          precio: Number(prod.precio),
        }));
        setProductos(productosConImagen);
      })
      .catch((err) => console.error(err));
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:3000/api/login", {
        correo,
        contrasena,
      });
      const datosUsuario = {
        alias: res.data.usuario.alias,
        rol: res.data.usuario.rol,
        imagen: "https://via.placeholder.com/100",
      };
      setUsuario(datosUsuario);
      localStorage.setItem("usuario", JSON.stringify(datosUsuario));
      localStorage.setItem("token", res.data.token);
      limpiarCampos();
      setMostrarLogin(false);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al iniciar sesión");
      limpiarCampos();
    }
  };

  const handleRegistro = async () => {
    try {
      const res = await axios.post("http://localhost:3000/api/register", {
        alias,
        correo,
        contrasena,
      });
      const datosUsuario = {
        alias: res.data.usuario.alias,
        rol: res.data.usuario.rol,
        imagen: "https://via.placeholder.com/100",
      };
      setUsuario(datosUsuario);
      localStorage.setItem("usuario", JSON.stringify(datosUsuario));
      localStorage.setItem("token", res.data.token);
      limpiarCampos();
      setMostrarRegistro(false);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al registrarse");
      limpiarCampos();
    }
  };

  const limpiarCampos = () => {
    setAlias("");
    setCorreo("");
    setContrasena("");
    setError("");
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
  };

  const añadirAlCarrito = (producto) => {
    if (!usuario) return;
    const productoExistente = carrito.find((p) => p.id === producto.id);
    if (productoExistente) {
      setCarrito(
        carrito.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p,
        ),
      );
    } else if (producto.stock > 0) {
      setCarrito([
        ...carrito,
        { ...producto, precio: Number(producto.precio), cantidad: 1 },
      ]);
    }
  };

  const quitarDelCarrito = (id) => {
    const producto = carrito.find((p) => p.id === id);
    if (!producto) return;

    if (producto.cantidad > 1) {
      setCarrito(
        carrito.map((p) =>
          p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p,
        ),
      );
    } else {
      setCarrito(carrito.filter((p) => p.id !== id));
    }
  };

  const eliminarProducto = (id) => {
    axios
      .delete(`http://localhost:3000/api/productos/${id}`)
      .then(() => obtenerProductos())
      .catch((err) => console.error(err));
  };

  const editarProducto = (producto) => {
    setProductoEnEdicion(producto);
  };

  const guardarEdicion = () => {
    axios
      .put(
        `http://localhost:3000/api/productos/${productoEnEdicion.id}`,
        productoEnEdicion,
      )
      .then(() => {
        obtenerProductos();
        setProductoEnEdicion(null);
      })
      .catch((err) => console.error(err));
  };

  const agregarProducto = () => {
    axios
      .post("http://localhost:3000/api/productos", nuevoProducto)
      .then(() => {
        obtenerProductos();
        setMostrarAgregar(false);
        setNuevoProducto({
          nombre: "",
          descripcion: "",
          precio: "",
          imagen: "",
          stock: "",
        });
      })
      .catch((err) => console.error(err));
  };

  const generarPDF = () => {
    const doc = new jsPDF();

    doc.text("Resumen de Compra", 20, 20);
    doc.text(`Cliente: ${usuario.alias}`, 20, 30);

    const productosTabla = carrito.map((prod) => [
      prod.nombre,
      prod.cantidad,
      (prod.precio * prod.cantidad).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
      }),
    ]);

    autoTable(doc, {
      head: [["Producto", "Precio"]],
      body: productosTabla,
      startY: 40,
    });

    doc.text(
      `Total: ${totalCarrito.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
      })}`,
      20,
      doc.lastAutoTable.finalY + 10,
    );

    doc.save("resumen_compra.pdf");
  };

  const comprar = () => {
    if (!usuario || carrito.length === 0) return;

    const productosParaComprar = carrito.map((p) => ({
      id: p.id,
      cantidad: 1,
    }));

    axios
      .post("http://localhost:3000/api/productos/comprar", {
        productos: productosParaComprar,
      })
      .then(() => {
        generarPDF();
        setCarrito([]);
        obtenerProductos();
      })
      .catch((err) => console.error(err));
  };

  const totalCarrito = carrito.reduce(
    (total, prod) => total + prod.precio * prod.cantidad,
    0,
  );

  return (
    <div style={{ display: "flex" }}>
      <div style={{ flex: 1, padding: "20px" }}>
        <h1>Tienda Online</h1>
        {usuario?.rol === "admin" && (
          <button onClick={() => setMostrarAgregar(true)}>
            Agregar Producto
          </button>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}>
          {productos.map((producto) => (
            <div
              key={producto.id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "8px",
                position: "relative",
              }}>
              <img
                src={producto.imagen}
                alt={producto.nombre}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                }}
              />
              <h2>{producto.nombre}</h2>
              <p>{producto.descripcion}</p>
              <p style={{ fontWeight: "bold" }}>
                {Number(producto.precio).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                })}
              </p>
              {producto.stock > 0 ? (
                <button
                  disabled={!usuario}
                  onClick={() => añadirAlCarrito(producto)}>
                  Añadir al carrito
                </button>
              ) : (
                <p style={{ color: "red", fontWeight: "bold" }}>Sin stock</p>
              )}

              {usuario?.rol === "admin" && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    onClick={() => editarProducto(producto)}
                    style={{ marginRight: "5px" }}>
                    Editar
                  </button>
                  <button onClick={() => eliminarProducto(producto.id)}>
                    Eliminar
                  </button>
                </div>
              )}

              {productoEnEdicion?.id === producto.id && (
                <div style={{ marginTop: "10px" }}>
                  <input
                    value={productoEnEdicion.nombre}
                    onChange={(e) =>
                      setProductoEnEdicion({
                        ...productoEnEdicion,
                        nombre: e.target.value,
                      })
                    }
                    placeholder="Nombre"
                  />
                  <input
                    value={productoEnEdicion.descripcion}
                    onChange={(e) =>
                      setProductoEnEdicion({
                        ...productoEnEdicion,
                        descripcion: e.target.value,
                      })
                    }
                    placeholder="Descripción"
                  />
                  <input
                    value={productoEnEdicion.precio}
                    onChange={(e) =>
                      setProductoEnEdicion({
                        ...productoEnEdicion,
                        precio: e.target.value,
                      })
                    }
                    placeholder="Precio"
                    type="number"
                  />
                  <input
                    value={productoEnEdicion.imagen}
                    onChange={(e) =>
                      setProductoEnEdicion({
                        ...productoEnEdicion,
                        imagen: e.target.value,
                      })
                    }
                    placeholder="URL Imagen"
                  />
                  <input
                    value={productoEnEdicion.stock}
                    onChange={(e) =>
                      setProductoEnEdicion({
                        ...productoEnEdicion,
                        stock: e.target.value,
                      })
                    }
                    placeholder="Stock"
                    type="number"
                  />
                  <button onClick={guardarEdicion}>Guardar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: "250px", background: "#f4f4f4", padding: "20px" }}>
        {!usuario ? (
          <div>
            <button onClick={() => setMostrarLogin(true)}>
              Iniciar Sesión
            </button>
            <button onClick={() => setMostrarRegistro(true)}>
              Registrarse
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: "center" }}>
              <img
                src={"https://avatar.iran.liara.run/public/18"}
                alt="avatar"
                style={{ width: "80px", borderRadius: "50%" }}
              />
              <p>{usuario.alias}</p>
            </div>
            <button
              onClick={handleLogout}
              style={{ marginTop: "10px", width: "100%" }}>
              Cerrar Sesión
            </button>
          </div>
        )}

        <h2 style={{ marginTop: "30px" }}>Carrito</h2>
        {carrito.length === 0 ? (
          <p>El carrito está vacío.</p>
        ) : (
          <ul>
            {carrito.map((prod) => (
              <li
                key={prod.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                }}>
                <span>
                  {prod.nombre} x {prod.cantidad} -{" "}
                  {Number(prod.precio * prod.cantidad).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                  })}
                </span>
                <button onClick={() => quitarDelCarrito(prod.id)}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
        <p style={{ fontWeight: "bold" }}>
          Total:{" "}
          {totalCarrito.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
          })}
        </p>

        {usuario && carrito.length > 0 && (
          <button
            onClick={comprar}
            style={{ marginTop: "10px", width: "100%" }}>
            Comprar
          </button>
        )}
      </div>

      {/* Modal Login */}
      {mostrarLogin && (
        <div style={modalStyles}>
          <div style={modalContentStyles}>
            <span
              style={cerrarModalEstilo}
              onClick={() => setMostrarLogin(false)}>
              X
            </span>
            <h2>Iniciar Sesión</h2>
            <input
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <input
              type={mostrarContrasenaLogin ? "text" : "password"}
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
            <label>
              <input
                type="checkbox"
                checked={mostrarContrasenaLogin}
                onChange={() =>
                  setMostrarContrasenaLogin(!mostrarContrasenaLogin)
                }
              />{" "}
              Mostrar contraseña
            </label>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button onClick={handleLogin}>Ingresar</button>
          </div>
        </div>
      )}

      {/* Modal Registro */}
      {mostrarRegistro && (
        <div style={modalStyles}>
          <div style={modalContentStyles}>
            <span
              style={cerrarModalEstilo}
              onClick={() => setMostrarRegistro(false)}>
              X
            </span>
            <h2>Registrarse</h2>
            <input
              placeholder="Alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
            <input
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <input
              type={mostrarContrasenaRegistro ? "text" : "password"}
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
            <label>
              <input
                type="checkbox"
                checked={mostrarContrasenaRegistro}
                onChange={() =>
                  setMostrarContrasenaRegistro(!mostrarContrasenaRegistro)
                }
              />{" "}
              Mostrar contraseña
            </label>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button onClick={handleRegistro}>Registrarse</button>
          </div>
        </div>
      )}

      {/* Modal Agregar Producto */}
      {mostrarAgregar && (
        <div style={modalStyles}>
          <div style={modalContentStyles}>
            <span
              style={cerrarModalEstilo}
              onClick={() => setMostrarAgregar(false)}>
              X
            </span>
            <h2>Agregar Producto</h2>
            <input
              placeholder="Nombre"
              value={nuevoProducto.nombre}
              onChange={(e) =>
                setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })
              }
            />
            <input
              placeholder="Descripción"
              value={nuevoProducto.descripcion}
              onChange={(e) =>
                setNuevoProducto({
                  ...nuevoProducto,
                  descripcion: e.target.value,
                })
              }
            />
            <input
              placeholder="Precio"
              type="number"
              value={nuevoProducto.precio}
              onChange={(e) =>
                setNuevoProducto({ ...nuevoProducto, precio: e.target.value })
              }
            />
            <input
              placeholder="URL Imagen"
              value={nuevoProducto.imagen}
              onChange={(e) =>
                setNuevoProducto({ ...nuevoProducto, imagen: e.target.value })
              }
            />
            <input
              placeholder="Stock"
              type="number"
              value={nuevoProducto.stock}
              onChange={(e) =>
                setNuevoProducto({ ...nuevoProducto, stock: e.target.value })
              }
            />
            <button onClick={agregarProducto}>Agregar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyles = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalContentStyles = {
  position: "relative",
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  minWidth: "300px",
};

const cerrarModalEstilo = {
  position: "absolute",
  top: "10px",
  right: "15px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "18px",
};
