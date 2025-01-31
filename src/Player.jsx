import { useRapier, RigidBody } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"
import { useKeyboardControls } from "@react-three/drei"
import { useRef, useEffect, useState } from "react"
import * as THREE from 'three'
import useGame from "./stores/useGame"

export default function Player()
{
    const body = useRef()

    //TSL

    

    //Audio
    const windAudio = new Audio('/wind.mp3')
    const hitAudio = new Audio('/hit.mp3')
    windAudio.volume = 0.2


    const [ subscribeKeys, getKeys ] = useKeyboardControls()
    const { rapier, world } = useRapier()
    const rapierWorld = world

    const [ smoothedCameraPosition ] = useState(() => new THREE.Vector3(10, 10, 10))
    const [ smoothedCameraTarget ] = useState(() => new THREE.Vector3())

    const start = useGame((state) => state.start)
    const end = useGame((state) => state.end)
    const restart = useGame((state) => state.restart)
    const blocksCount = useGame((state) => state.blocksCount)

    // Jump    

    const jump = () =>
    {
        const origin = body.current.translation()
        origin.y -= 0.31
        const direction = { x: 0, y: - 1, z: 0 }
        const ray = new rapier.Ray(origin, direction)
        const hit = rapierWorld.castRay(ray, 10, true)
        
        if(hit.timeOfImpact < 0.15)
            body.current.applyImpulse({ x: 0, y: 0.5, z: 0 })
            windAudio.play()
    }

    const reset = () =>
    {
        body.current.setTranslation({ x: 0, y: 1, z: 0 })
        body.current.setLinvel({ x: 0, y: 0, z: 0 })
        body.current.setAngvel({ x: 0, y: 0, z: 0 })
    }

    useEffect(() => 
    {
        const unsubscribeReset = useGame.subscribe(
            (state) => state.phase,
            (value) => 
            {
                if(value === 'ready')
                    reset()
            }
        )

        const unsubscribeJump = subscribeKeys(
            (state) => state.jump,
            (value) => 
            {
                if(value)
                    jump()
            }
        )

        const unsubscribeAny = subscribeKeys(
            () => 
            {
                start()
            })

        return () => 
        {
            unsubscribeJump()
            unsubscribeAny()
            unsubscribeReset()
        }
    }, [])

    useFrame((state, delta) =>
    {
        
        // Controls

        const { forward, backward, leftward, rightward } = getKeys()
        const impulse = { x: 0, y: 0, z: 0 } 
        const torque = { x: 0, y: 0, z: 0 } 

        const impulseStrength = 0.6 * delta
        const torqueStrength = 0.2 * delta

        if(forward)
        {
            impulse.z -= impulseStrength
            torque.x -= torqueStrength
        }

        if(rightward)
        {
            impulse.x += impulseStrength
            torque.z -= torqueStrength
        }

        if(backward)
        {
            impulse.z += impulseStrength
            torque.x += torqueStrength
        }

        if(leftward)
        {
            impulse.x -= impulseStrength
            torque.z += torqueStrength
        }
        
        body.current.applyImpulse(impulse)
        body.current.applyTorqueImpulse(torque)

        //Camera

        const bodyPosition = body.current.translation()

        const cameraPosition = new THREE.Vector3()
        cameraPosition.copy(bodyPosition)
        cameraPosition.z += 2.25
        cameraPosition.y += 0.65

        const cameraTarget = new THREE.Vector3()
        cameraTarget.copy(bodyPosition)
        cameraTarget.y += 0.25
        
        smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
        smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

        state.camera.position.copy(cameraPosition)
        state.camera.lookAt(cameraTarget)

        // Phases

    if(bodyPosition.z < - (blocksCount * 4 + 2))
        end()
    if(bodyPosition.y < - 4)
        restart()
    })

    return <RigidBody
    ref={ body }
    canSleep={ false }
    colliders="ball"
    restitution={ 0.2 } 
    friction={ 1 }
    linearDamping={ 0.5 }
    angularDamping={ 0.5 }
    position={ [ 0, 1, 0 ] }
    onCollisionEnter={({ manifold, target, other }) => {

        if (other.rigidBodyObject) {
            target.rigidBodyObject.name,
            other.rigidBodyObject
            hitAudio.play()
        }
      }}
    >
        <mesh castShadow>
            <icosahedronGeometry args={ [ 0.3, 1 ] } />
            <meshStandardMaterial flatShading color="mediumpurple" />
            
        </mesh>
    </RigidBody>

}
