$(document).ready(function () {

    console.log("🔥 ASL - Auto Programa de Cargue iniciado");

    var programas = [];

    // =========================================================
    // WEB API
    // =========================================================

    (function (webapi, $) {

        function safeAjax(ajaxOptions) {

            var deferredAjax = $.Deferred();

            shell.getTokenDeferred().done(function (token) {

                ajaxOptions.headers = ajaxOptions.headers || {};
                ajaxOptions.headers["__RequestVerificationToken"] = token;

                $.ajax(ajaxOptions)

                    .done(function (data, textStatus, jqXHR) {

                        validateLoginSession(
                            data,
                            textStatus,
                            jqXHR,
                            deferredAjax.resolve
                        );

                    })

                    .fail(deferredAjax.reject);

            }).fail(function () {

                deferredAjax.rejectWith(this, arguments);

            });

            return deferredAjax.promise();
        }

        webapi.safeAjax = safeAjax;

    })(window.webapi = window.webapi || {}, jQuery);


    // =========================================================
    // OBTENER PROGRAMAS
    // =========================================================

    webapi.safeAjax({

        type: "GET",

        url: "/_api/cr904_programadecargues" +
     "?$select=cr904_programadecargueid,cr904_fecha,cr904_totalvehiculosacargar,cr904_iddeprograma,cr904_estadodelprograma",

        contentType: "application/json"

    })

    .done(function (data) {

        programas = data.value || [];

        console.log(
            "🔥 Programas cargados:",
            programas.length
        );

        intentarAsignarPrograma();

    })

    .fail(function (error) {

        console.error(
            "❌ No se pudieron cargar los programas:",
            error
        );

    });


    // =========================================================
    // CONVERTIR FECHA A YYYY-MM-DD
    // =========================================================

    function normalizarFecha(valor) {

        if (!valor) {
            return null;
        }

        // Si viene como objeto Date
        if (valor instanceof Date && !isNaN(valor.getTime())) {

            var yyyy = valor.getFullYear();
            var mm = String(valor.getMonth() + 1).padStart(2, "0");
            var dd = String(valor.getDate()).padStart(2, "0");

            return yyyy + "-" + mm + "-" + dd;
        }

        valor = String(valor).trim();

        // DD/MM/YYYY
        var partes = valor.split("/");

        if (partes.length === 3) {

            return partes[2] + "-" +
                   partes[1].padStart(2, "0") + "-" +
                   partes[0].padStart(2, "0");
        }

        // YYYY-MM-DD o ISO
        if (valor.length >= 10 && valor[4] === "-") {

            return valor.substring(0, 10);
        }

        return null;
    }


    // =========================================================
    // OBTENER FECHA DEL FORMULARIO
    // =========================================================

    function obtenerFechaCargue() {

    var datePicker = $("#cr904_fecha")
        .siblings(".datetimepicker")
        .data("DateTimePicker");

    if (!datePicker) {
        console.log("❌ No se encontró el DateTimePicker");
        return null;
    }

    var fecha = datePicker.date();

    if (!fecha) {
        console.log("⚠️ El DatePicker todavía no tiene fecha");
        return null;
    }

    var resultado = fecha.format("YYYY-MM-DD");

    console.log("📅 Fecha obtenida correctamente:", resultado);

    return resultado;
    }


    // =========================================================
    // COLOCAR LOOKUP
    // =========================================================

    function colocarPrograma(programa) {

        var guid = programa.cr904_programadecargueid;
        var estadoPrograma = programa.cr904_estadodelprograma;

console.log(
    "📌 Estado del programa:",
    estadoPrograma
);

        /*
         * IMPORTANTE:
         * El campo _name debe contener el nombre primario
         * del registro relacionado.
         *
         * Como nuestro programa tiene ID de programa,
         * utilizamos ese valor como texto visible.
         */

        var nombrePrograma =
            programa.cr904_iddeprograma ||
            "Programa de Cargue";
            mostrarProgramaAsignado(nombrePrograma);

        $("#cr904_programadecargue").val(guid);

        $("#cr904_programadecargue_name").val(nombrePrograma);

        $("#cr904_programadecargue_entityname")
            .val("cr904_programadecargue");

        // También actualizamos el atributo value
        $("#cr904_programadecargue")
            .attr("value", guid);

        $("#cr904_programadecargue_name")
            .attr("value", nombrePrograma);

        $("#cr904_programadecargue_entityname")
            .attr("value", "cr904_programadecargue");

        console.log(
            "✅ Programa asignado automáticamente:",
            guid
        );

        function mostrarProgramaAsignado(nombrePrograma) {

    var contenedor = $("#asl-programa-asignado");

    if (!contenedor.length) {

        var grupoFecha = $("#cr904_fecha")
            .closest(".form-group");

        contenedor = $(
            '<div id="asl-programa-asignado">' +
                '<div class="asl-programa-label">Programa de Cargue</div>' +
                '<div class="asl-programa-barra">' +
                    '<span class="asl-programa-icon">📋</span>' +
                    '<span id="asl-programa-nombre">Selecciona una fecha</span>' +
                '</div>' +
            '</div>'
        );

        grupoFecha.after(contenedor);
    }

    $("#asl-programa-nombre").text(
        nombrePrograma || "Sin programa asignado"
    );
    }

    }


    // =========================================================
    // BUSCAR PROGRAMA POR FECHA
    // =========================================================

    function intentarAsignarPrograma() {

        if (!programas.length) {
            return;
        }

        var fechaCargue = obtenerFechaCargue();

        if (!fechaCargue) {
            return;
        }

        console.log(
            "📅 Fecha del cargue:",
            fechaCargue
        );

        var programaEncontrado = programas.find(function (programa) {

            var fechaPrograma =
                normalizarFecha(programa.cr904_fecha);

            return fechaPrograma === fechaCargue;

        });

        if (!programaEncontrado) {

            console.log(
                "⚠️ No existe Programa de Cargue para:",
                fechaCargue
            );

            $("#cr904_programadecargue").val("");
            $("#cr904_programadecargue_name").val("");
            $("#cr904_programadecargue_entityname").val("");

            return;
        }

        colocarPrograma(programaEncontrado);
    }


    // =========================================================
    // CUANDO CAMBIE LA FECHA
    // =========================================================

$("#cr904_fecha")
    .siblings(".datetimepicker")
    .on("dp.change", function () {

        console.log("🔥 Cambio de fecha detectado");

        setTimeout(function () {
            intentarAsignarPrograma();
        }, 200);

    });


// =========================================================
// VALIDACIÓN DE CUPO ANTES DE GUARDAR
// =========================================================

var validacionCupoEnProceso = false;
var validacionCupoAprobada = false;


// =========================================================
// VALIDAR CUPO DEL PROGRAMA
// =========================================================

function validarCupoAntesDeGuardar() {

    var programaGuid =
        $("#cr904_programadecargue").val();

    var cantidadNueva =
        parseInt(
            $("#cr904_cantidaddevehiculos").val(),
            10
        );


    // -----------------------------------------------------
    // VALIDACIONES BÁSICAS
    // -----------------------------------------------------

    if (!programaGuid) {

        alert(
            "❌ No se encontró el Programa de Cargue para la fecha seleccionada."
        );

        validacionCupoEnProceso = false;

        return;
    }


    if (!cantidadNueva || cantidadNueva <= 0) {

        alert(
            "❌ La cantidad de vehículos debe ser mayor que cero."
        );

        validacionCupoEnProceso = false;

        return;
    }


    // -----------------------------------------------------
    // BUSCAR EL PROGRAMA QUE YA OBTUVIMOS POR WEB API
    // -----------------------------------------------------

    var programa = programas.find(function (p) {

        return (
            p.cr904_programadecargueid &&
            p.cr904_programadecargueid.toLowerCase() ===
            programaGuid.toLowerCase()
        );

    });


    if (!programa) {

        alert(
            "❌ No se encontró la información del Programa de Cargue."
        );

        validacionCupoEnProceso = false;

        return;
    }

    // =====================================================
// BLOQUEAR CARGUES DE PROGRAMAS CERRADOS
// =====================================================

var estadoPrograma =
    parseInt(programa.cr904_estadodelprograma, 10);

console.log(
    "🔐 Estado del Programa:",
    estadoPrograma
);

if (estadoPrograma === 736490003) {

    alert(
        "🔒 PROGRAMA CERRADO\n\n" +
        "Este Programa de Cargue ya fue cerrado.\n\n" +
        "No se pueden registrar nuevos Cargues."
    );

    validacionCupoEnProceso = false;
    validacionCupoAprobada = false;

    return;
}


    var totalProgramado =
        parseInt(
            programa.cr904_totalvehiculosacargar,
            10
        ) || 0;


    console.log(
        "📋 Total programado:",
        totalProgramado
    );


    console.log(
        "🚚 Nuevo cargue:",
        cantidadNueva
    );

    var franjaNueva =
    parseInt(
        $("#cr904_franja").val(),
        10
    );

console.log(
    "🕐 Nueva franja:",
    franjaNueva
);

    // -----------------------------------------------------
    // CONSULTAR CARGUES EXISTENTES DEL MISMO PROGRAMA
    // -----------------------------------------------------

    window.webapi.safeAjax({

        type: "GET",

    url:
    "/_api/cr904_cargues" +
    "?$select=cr904_cantidaddevehiculos,cr904_franja" +
    "&$filter=_cr904_programadecargue_value eq " +
    programaGuid,

        contentType: "application/json"

    })

    .done(function (data) {

var totalExistente = 0;
var franjaYaRegistrada = false;

data.value.forEach(function (cargue) {

    totalExistente +=
        parseInt(
            cargue.cr904_cantidaddevehiculos,
            10
        ) || 0;

    var franjaExistente =
        parseInt(
            cargue.cr904_franja,
            10
        );

    if (franjaExistente === franjaNueva) {
        franjaYaRegistrada = true;
    }
});


    if (franjaYaRegistrada) {

    alert(
        "⚠️ ESTA FRANJA YA TIENE UN REGISTRO.\n\n" +
        "Franja: " +
        $("#cr904_franja option:selected").text() +
        "\n\n" +
        "Solo se permite un registro por franja."
    );

    validacionCupoEnProceso = false;
    validacionCupoAprobada = false;

    return;
}


        var totalFinal =
            totalExistente + cantidadNueva;


        var disponible =
            totalProgramado - totalExistente;


        console.log(
            "📊 Total cargado actualmente:",
            totalExistente
        );


        console.log(
            "📦 Disponible:",
            disponible
        );


        console.log(
            "📊 Total después del nuevo cargue:",
            totalFinal
        );


        // =================================================
        // BLOQUEAR SI SUPERA EL PROGRAMA
        // =================================================

        if (totalFinal > totalProgramado) {

            alert(
                "❌ NO SE PUEDE REGISTRAR EL CARGUE.\n\n" +

                "Total programado: " +
                totalProgramado +

                "\nCargado actualmente: " +
                totalExistente +

                "\nDisponible: " +
                disponible +

                "\nIntentas registrar: " +
                cantidadNueva +

                "\n\nEl cargue supera el total programado."
            );


            validacionCupoEnProceso = false;
            validacionCupoAprobada = false;

            return;
        }


        // =================================================
        // CUPO CORRECTO
        // =================================================

        console.log(
            "✅ CUPO DISPONIBLE. Se puede guardar."
        );


        validacionCupoEnProceso = false;
        validacionCupoAprobada = true;


        // Continuar con el guardado
        $("#InsertButton").trigger("click");

    })

    .fail(function (error) {

        console.error(
            "❌ Error consultando los Cargues:",
            error
        );


        alert(
            "❌ No fue posible validar el cupo del Programa de Cargue.\n\n" +
            "El registro no se guardará."
        );


        validacionCupoEnProceso = false;
        validacionCupoAprobada = false;

    });
}


// =========================================================
// INTERCEPTAR EL GUARDADO
// =========================================================

if (
    typeof entityFormClientValidate !== "undefined" &&
    typeof entityFormClientValidate === "function"
) {

    var validacionOriginal =
        entityFormClientValidate;


    entityFormClientValidate = function () {


        // -------------------------------------------------
        // YA FUE VALIDADO
        // -------------------------------------------------

        if (validacionCupoAprobada) {

            validacionCupoAprobada = false;

            return validacionOriginal.apply(
                this,
                arguments
            );
        }


        // -------------------------------------------------
        // VALIDACIÓN AJAX EN PROCESO
        // -------------------------------------------------

        if (validacionCupoEnProceso) {

            return false;
        }


        // -------------------------------------------------
        // VALIDACIÓN NORMAL DE POWER PAGES
        // -------------------------------------------------

        var valido =
            validacionOriginal.apply(
                this,
                arguments
            );


        if (!valido) {

            return false;
        }


        // -------------------------------------------------
        // ASEGURAR PROGRAMA AUTOMÁTICO
        // -------------------------------------------------

        intentarAsignarPrograma();


        var programaGuid =
            $("#cr904_programadecargue").val();


        if (!programaGuid) {

            alert(
                "❌ No se encontró automáticamente el Programa de Cargue."
            );

            return false;
        }


        // -------------------------------------------------
        // INICIAR VALIDACIÓN DE CUPO
        // -------------------------------------------------

        validacionCupoEnProceso = true;

        validarCupoAntesDeGuardar();


        // Detener temporalmente el Submit
        return false;
    };

    }

// =========================================================
// OCULTAR LOOKUP DE PROGRAMA
// =========================================================

setTimeout(function () {
    $("#cr904_programadecargue")
        .closest(".form-group")
        .hide();
}, 500);

});

// =========================================================
// CERRAR CARGUE
// =========================================================

$("#asl-btn-cerrar-cargue").on("click", function () {

    var programaGuid =
        $("#cr904_programadecargue").val();

    if (!programaGuid) {
        alert(
            "❌ No hay un Programa de Cargue seleccionado."
        );
        return;
    }

    console.log(
        "🔒 Programa para cerrar:",
        programaGuid
    );

    // -----------------------------------------------------
    // CONSULTAR CUMPLIMIENTO
    // -----------------------------------------------------

    window.webapi.safeAjax({
        type: "GET",

        url:
            "/_api/cr904_cumplimientodecargues" +
            "?$select=" +
            "cr904_cumplimientodecargueid," +
            "cr904_totalacargar," +
            "cr904_totalcargado," +
            "cr904_cumplimiento," +
            "cr904_novedades" +
            "&$filter=_cr904_programadecargue_value eq " +
            programaGuid,

        contentType: "application/json"

    })
    .done(function (data) {

        console.log(
            "📊 Cumplimiento encontrado:",
            data.value
        );

        if (!data.value.length) {

            alert(
                "❌ No se encontró el Cumplimiento de Cargue para este programa."
            );

            return;
        }

        var cumplimiento = data.value[0];

        var cumplimientoId =
            cumplimiento.cr904_cumplimientodecargueid;

        var porcentaje =
            parseFloat(
                cumplimiento.cr904_cumplimiento
            ) || 0;

        console.log(
            "📈 Cumplimiento:",
            porcentaje
        );

        // =================================================
        // CASO 1: 100% O MÁS
        // =================================================

        if (porcentaje >= 100) {

            var confirmar = confirm(
                "🟢 CARGUE COMPLETADO\n\n" +
                "El programa alcanzó el " +
                porcentaje +
                "% de cumplimiento.\n\n" +
                "La novedad será registrada automáticamente como:\n" +
                "\"Sin novedad\"\n\n" +
                "¿Deseas cerrar el Cargue?"
            );

            if (!confirmar) {
                return;
            }

            cerrarPrograma(
                programaGuid,
                cumplimientoId,
                "Sin novedad"
            );

            return;
        }

        // =================================================
        // CASO 2: MENOS DEL 100%
        // =================================================

        var novedad = prompt(
            "⚠️ EL CARGUE NO ESTÁ COMPLETO\n\n" +
            "Cumplimiento actual: " +
            porcentaje +
            "%\n\n" +
            "Para cerrar el Cargue debes registrar la novedad:\n\n" +
            "Ejemplo: Atraso en armado"
        );

        if (novedad === null) {
            return;
        }

        novedad = novedad.trim();

        if (!novedad) {

            alert(
                "⚠️ Debes registrar una novedad para cerrar un Cargue con menos del 100%."
            );

            return;
        }

        var confirmarCierre = confirm(
            "⚠️ CIERRE CON INCUMPLIMIENTO\n\n" +
            "Cumplimiento: " +
            porcentaje +
            "%\n\n" +
            "Novedad:\n" +
            novedad +
            "\n\n" +
            "¿Deseas cerrar el Cargue?"
        );

        if (!confirmarCierre) {
            return;
        }

        cerrarPrograma(
            programaGuid,
            cumplimientoId,
            novedad
        );

    })
    .fail(function (error) {

        console.error(
            "❌ Error consultando Cumplimiento:",
            error
        );

        alert(
            "❌ No fue posible consultar el Cumplimiento."
        );
    });
});


// =========================================================
// FUNCIÓN PARA CERRAR PROGRAMA
// =========================================================

function cerrarPrograma(
    programaGuid,
    cumplimientoId,
    novedad
) {

    console.log(
        "🔒 Cerrando programa:",
        programaGuid
    );

    console.log(
        "📝 Novedad:",
        novedad
    );

    // -----------------------------------------------------
    // 1. GUARDAR NOVEDAD EN CUMPLIMIENTO
    // -----------------------------------------------------

    window.webapi.safeAjax({

        type: "PATCH",

        url:
            "/_api/cr904_cumplimientodecargues(" +
            cumplimientoId +
            ")",

        contentType: "application/json",

        data: JSON.stringify({

            cr904_novedades: novedad

        })

    })
    .done(function () {

        console.log(
            "✅ Novedad guardada."
        );

        // -------------------------------------------------
        // 2. CAMBIAR PROGRAMA A CERRADO
        // -------------------------------------------------

        window.webapi.safeAjax({

            type: "PATCH",

            url:
                "/_api/cr904_programadecargues(" +
                programaGuid +
                ")",

            contentType: "application/json",

            data: JSON.stringify({

                cr904_estadodelprograma: 736490003

            })

        })
        .done(function () {

            console.log(
                "🔒 Programa cerrado correctamente."
            );

            alert(
                "✅ CARGUE CERRADO CORRECTAMENTE\n\n" +
                "La novedad fue registrada y el Programa de Cargue quedó cerrado."
            );

            location.reload();

        })
        .fail(function (error) {

            console.error(
                "❌ Error cerrando Programa:",
                error
            );

            alert(
                "❌ La novedad se guardó, pero no fue posible cerrar el Programa."
            );
        });

    })
    .fail(function (error) {

        console.error(
            "❌ Error guardando novedad:",
            error
        );

        alert(
            "❌ No fue posible guardar la novedad.\n\n" +
            "El Cargue no será cerrado."
        );
    });
}

